import type { Database } from '@/types/database';
import { parsePeriod } from '@/utils/format';

import { db } from './supabase';

type Enums = Database['public']['Enums'];
export type EventStatus = Enums['event_status'];
export type ReservationStatus = Enums['reservation_status'];
export type CategoryType = Enums['category_type'];

/** Los mensajes de las funciones de la base (EV4xx) ya vienen en español. */
export class ApiError extends Error {}

function check<T>(result: { data: T | null; error: { message: string; code?: string } | null }): T {
  if (result.error) {
    const own = result.error.code?.startsWith('EV');
    throw new ApiError(own ? result.error.message : 'No pudimos cargar la información. Revisa tu conexión e intenta de nuevo.');
  }
  return result.data as T;
}

const average = (values: number[]) =>
  values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : null;

/** Texto de búsqueda seguro para filtros ilike de PostgREST. */
const clean = (text: string) => text.replace(/[%,()*]/g, ' ').trim();

// ---------- categorías ----------
export type Category = { id: string; name: string };

export async function listCategories(type: CategoryType): Promise<Category[]> {
  return check(await db().from('categorias').select('id, name').eq('type', type).order('name'));
}

// ---------- lugares ----------
export type VenueSummary = {
  id: string;
  name: string;
  city: string;
  address: string | null;
  capacity: number;
  price: number;
  categoryName: string | null;
  imageUrl: string | null;
  rating: number | null;
  reviews: number;
};

export async function listVenues(
  opts: { search?: string; categoryId?: string | null; minCapacity?: number; limit?: number } = {},
): Promise<VenueSummary[]> {
  let query = db()
    .from('lugares')
    .select('id, name, city, address, capacity, price, categorias(name), imagenes_lugar(image_url, position), valoraciones(rating)')
    .eq('status', 'ACTIVE')
    .order('name');
  const search = clean(opts.search ?? '');
  if (search) query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%`);
  if (opts.categoryId) query = query.eq('category_id', opts.categoryId);
  if (opts.minCapacity) query = query.gte('capacity', opts.minCapacity);
  if (opts.limit) query = query.limit(opts.limit);

  return check(await query).map((v) => {
    const images = [...(v.imagenes_lugar ?? [])].sort((a, b) => a.position - b.position);
    const ratings = (v.valoraciones ?? []).map((r) => r.rating);
    return {
      id: v.id,
      name: v.name,
      city: v.city,
      address: v.address,
      capacity: v.capacity,
      price: v.price,
      categoryName: v.categorias?.name ?? null,
      imageUrl: images[0]?.image_url ?? null,
      rating: average(ratings),
      reviews: ratings.length,
    };
  });
}

// ---------- servicios ----------
export type ServiceSummary = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: Enums['service_unit'];
  categoryName: string | null;
  providerName: string | null;
};

export async function listServices(opts: { categoryId?: string | null; limit?: number } = {}): Promise<ServiceSummary[]> {
  let query = db()
    .from('servicios')
    .select('id, name, description, price, unit, categorias(name), perfiles_proveedor(business_name)')
    .eq('status', 'ACTIVE')
    .order('name');
  if (opts.categoryId) query = query.eq('category_id', opts.categoryId);
  if (opts.limit) query = query.limit(opts.limit);
  return check(await query).map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    price: s.price,
    unit: s.unit,
    categoryName: s.categorias?.name ?? null,
    providerName: s.perfiles_proveedor?.business_name ?? null,
  }));
}

export const unitLabel: Record<Enums['service_unit'], string> = {
  per_event: 'por evento',
  per_person: 'por persona',
  per_hour: 'por hora',
};

// ---------- eventos del cliente ----------
export type EventSummary = {
  id: string;
  name: string;
  typeName: string | null;
  date: string | null;
  startTime: string | null;
  guests: number;
  budget: number | null;
  city: string | null;
  status: EventStatus;
  total: number;
  servicesCount: number;
  venueName: string | null;
  reservationStatus: ReservationStatus | null;
};

async function totalsFor(eventIds: string[]): Promise<Map<string, number>> {
  if (!eventIds.length) return new Map();
  const rows = check(await db().from('totales_evento').select('event_id, total').in('event_id', eventIds));
  return new Map(rows.map((r) => [r.event_id ?? '', r.total ?? 0]));
}

export async function listMyEvents(userId: string): Promise<EventSummary[]> {
  const rows = check(
    await db()
      .from('eventos')
      .select(
        'id, name, date, start_time, guests, budget, city, status, categorias(name), servicios_evento(id), reservas(status, created_at, lugares(name))',
      )
      .eq('user_id', userId)
      .order('date', { ascending: true, nullsFirst: false }),
  );
  const totals = await totalsFor(rows.map((r) => r.id));
  return rows.map((e) => {
    // La reserva vigente: activa si existe, si no la más reciente.
    const reservations = [...(e.reservas ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
    const current =
      reservations.find((r) => r.status === 'PENDING' || r.status === 'CONFIRMED' || r.status === 'COMPLETED') ??
      reservations[0];
    return {
      id: e.id,
      name: e.name,
      typeName: e.categorias?.name ?? null,
      date: e.date,
      startTime: e.start_time,
      guests: e.guests,
      budget: e.budget,
      city: e.city,
      status: e.status,
      total: totals.get(e.id) ?? 0,
      servicesCount: e.servicios_evento?.length ?? 0,
      venueName: current?.lugares?.name ?? null,
      reservationStatus: current?.status ?? null,
    };
  });
}

// ---------- reservas del cliente ----------
export type ReservationSummary = {
  id: string;
  status: ReservationStatus;
  start: Date | null;
  end: Date | null;
  eventName: string;
  eventType: string | null;
  venueName: string;
  venueCity: string;
  total: number;
};

export async function listMyReservations(userId: string): Promise<ReservationSummary[]> {
  const rows = check(
    await db()
      .from('reservas')
      .select('id, status, period, event_id, eventos!inner(name, user_id, categorias(name)), lugares(name, city)')
      .eq('eventos.user_id', userId)
      .order('created_at', { ascending: false }),
  );
  const totals = await totalsFor([...new Set(rows.map((r) => r.event_id))]);
  return rows
    .map((r) => {
      const period = parsePeriod(String(r.period));
      return {
        id: r.id,
        status: r.status,
        start: period?.start ?? null,
        end: period?.end ?? null,
        eventName: r.eventos.name,
        eventType: r.eventos.categorias?.name ?? null,
        venueName: r.lugares?.name ?? 'Lugar',
        venueCity: r.lugares?.city ?? '',
        total: totals.get(r.event_id) ?? 0,
      };
    })
    .sort((a, b) => (a.start?.getTime() ?? 0) - (b.start?.getTime() ?? 0));
}

export async function cancelReservation(reservationId: string): Promise<void> {
  check(await db().rpc('cancelar_reserva', { p_reserva_id: reservationId }));
}

// ---------- panel del proveedor ----------
export type ProviderRequest = {
  id: string;
  kind: 'venue' | 'service';
  status: ReservationStatus;
  itemName: string;
  clientName: string;
  clientPhone: string | null;
  eventName: string;
  guests: number;
  date: string | null;
  start: Date | null;
  amount: number;
};

export type ProviderDashboard = {
  businessName: string;
  city: string;
  verified: boolean;
  received: number;
  confirmed: number;
  confirmedIncome: number;
  activeListings: number;
  rating: number | null;
  pending: ProviderRequest[];
};

export async function getProviderDashboard(userId: string): Promise<ProviderDashboard | null> {
  const { data: business, error: businessError } = await db()
    .from('perfiles_proveedor')
    .select('id, business_name, city, verified')
    .eq('user_id', userId)
    .maybeSingle();
  if (businessError) throw new ApiError('No pudimos cargar tu negocio. Revisa tu conexión e intenta de nuevo.');
  if (!business) return null;

  const [venues, services, venueRows, serviceRows] = await Promise.all([
    db().from('lugares').select('id, status').eq('provider_id', business.id).then(check),
    db().from('servicios').select('id, status').eq('provider_id', business.id).then(check),
    db()
      .from('reservas')
      .select('id, status, period, venue_price, lugares!inner(name, provider_id), eventos(name, guests, date, usuarios(full_name, phone))')
      .eq('lugares.provider_id', business.id)
      .then(check),
    db()
      .from('servicios_evento')
      .select('id, status, subtotal, servicios!inner(name, provider_id), eventos(name, guests, date, start_time, usuarios(full_name, phone))')
      .eq('servicios.provider_id', business.id)
      .then(check),
  ]);

  const requests: ProviderRequest[] = [
    ...venueRows.map((r) => ({
      id: r.id,
      kind: 'venue' as const,
      status: r.status,
      itemName: r.lugares.name,
      clientName: r.eventos?.usuarios?.full_name ?? 'Cliente',
      clientPhone: r.eventos?.usuarios?.phone ?? null,
      eventName: r.eventos?.name ?? 'Evento',
      guests: r.eventos?.guests ?? 0,
      date: r.eventos?.date ?? null,
      start: parsePeriod(String(r.period))?.start ?? null,
      amount: r.venue_price,
    })),
    ...serviceRows.map((s) => ({
      id: s.id,
      kind: 'service' as const,
      status: s.status,
      itemName: s.servicios.name,
      clientName: s.eventos?.usuarios?.full_name ?? 'Cliente',
      clientPhone: s.eventos?.usuarios?.phone ?? null,
      eventName: s.eventos?.name ?? 'Evento',
      guests: s.eventos?.guests ?? 0,
      date: s.eventos?.date ?? null,
      start: null,
      amount: s.subtotal ?? 0,
    })),
  ];

  const ids = { venues: venues.map((v) => v.id), services: services.map((s) => s.id) };
  const filters = [
    ids.venues.length ? `venue_id.in.(${ids.venues.join(',')})` : null,
    ids.services.length ? `service_id.in.(${ids.services.join(',')})` : null,
  ].filter(Boolean);
  const ratings = filters.length
    ? check(await db().from('valoraciones').select('rating').or(filters.join(','))).map((r) => r.rating)
    : [];

  const done = requests.filter((r) => r.status === 'CONFIRMED' || r.status === 'COMPLETED');
  return {
    businessName: business.business_name,
    city: business.city,
    verified: business.verified,
    received: requests.length,
    confirmed: done.length,
    confirmedIncome: done.reduce((sum, r) => sum + r.amount, 0),
    activeListings: [...venues, ...services].filter((x) => x.status === 'ACTIVE').length,
    rating: average(ratings),
    pending: requests
      .filter((r) => r.status === 'PENDING')
      .sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999')),
  };
}

export async function respondToRequest(request: Pick<ProviderRequest, 'id' | 'kind'>, accept: boolean): Promise<void> {
  if (request.kind === 'venue') {
    check(await db().rpc('responder_reserva', { p_reserva_id: request.id, p_aceptar: accept }));
  } else {
    check(await db().rpc('responder_servicio', { p_servicio_evento_id: request.id, p_aceptar: accept }));
  }
}
