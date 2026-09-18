import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ListingItem from '../components/ListingItem';
import { FaFilter, FaSearchLocation, FaTimes, FaTh, FaThLarge } from 'react-icons/fa';

const CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata',
  'Pune', 'Jaipur', 'Ahmedabad', 'Gurugram', 'Noida', 'Lucknow',
  'Chandigarh', 'Kochi',
];

const BEDROOM_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '0', label: 'Studio' },
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
  { value: '5', label: '5+' },
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'Rent & Sale' },
  { value: 'rent', label: 'Rent' },
  { value: 'sale', label: 'Sale' },
];

const AMENITIES = [
  { key: 'parking', label: 'Parking' },
  { key: 'furnished', label: 'Furnished' },
  { key: 'offer', label: 'Offer' },
];

const PRICE_PRESETS = {
  rent: [
    { label: 'Under ₹10k', min: '', max: '10000' },
    { label: '₹10k–25k', min: '10000', max: '25000' },
    { label: '₹25k–50k', min: '25000', max: '50000' },
    { label: '₹50k+', min: '50000', max: '' },
  ],
  sale: [
    { label: 'Under ₹25L', min: '', max: '2500000' },
    { label: '₹25L–75L', min: '2500000', max: '7500000' },
    { label: '₹75L–1.5Cr', min: '7500000', max: '15000000' },
    { label: '1.5Cr+', min: '15000000', max: '' },
  ],
};

const DEFAULT_PARAMS = {
  searchTerm: '',
  type: 'all',
  parking: false,
  furnished: false,
  offer: false,
  sort: 'created_at',
  order: 'desc',
  minPrice: '',
  maxPrice: '',
  bedrooms: '',
  city: '',
};

const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

// Validate price inputs - ensure min is less than max
const validatePriceRange = (min, max) => {
  if (min !== '' && max !== '' && Number(min) >= Number(max)) return false;
  return true;
};

const SectionLabel = ({ children }) => (
  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
    {children}
  </span>
);

const PillBtn = ({ active, onClick, children, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${active
      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20'
      : 'hover:opacity-80'} ${className}`}
    style={active ? {} : { backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
  >
    {children}
  </button>
);

const SkeletonCard = ({ dense }) => (
  <div className="rounded-2xl overflow-hidden border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
    <div className={`skeleton w-full ${dense ? 'h-[140px]' : 'h-[180px]'}`} />
    <div className="p-4 space-y-3">
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="skeleton h-3 w-1/2 rounded" />
      <div className="skeleton h-8 w-2/5 rounded" />
    </div>
  </div>
);

export default function Search() {
  const navigate = useNavigate();
  const location = useLocation();

  const getParamsFromUrl = () => {
    const p = new URLSearchParams(location.search);
    return {
      searchTerm: p.get('searchTerm') || '',
      type: p.get('type') || 'all',
      parking: p.get('parking') === 'true',
      furnished: p.get('furnished') === 'true',
      offer: p.get('offer') === 'true',
      sort: p.get('sort') || 'created_at',
      order: p.get('order') || 'desc',
      minPrice: p.get('minPrice') || '',
      maxPrice: p.get('maxPrice') || '',
      bedrooms: p.get('bedrooms') || '',
      city: p.get('city') || '',
    };
  };

  const [params, setParams] = useState(getParamsFromUrl);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [showMore, setShowMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [dense, setDense] = useState(() => localStorage.getItem('oasis:grid-density') === 'compact');
  const firstRender = useRef(true);

  const paramsKey = useMemo(() => JSON.stringify(params), [params]);

  const buildSearchQuery = (p) => {
    const q = new URLSearchParams();
    if (p.searchTerm) q.set('searchTerm', p.searchTerm);
    if (p.type && p.type !== 'all') q.set('type', p.type);
    if (p.parking) q.set('parking', 'true');
    if (p.furnished) q.set('furnished', 'true');
    if (p.offer) q.set('offer', 'true');
    if (p.sort && p.sort !== 'created_at') q.set('sort', p.sort);
    if (p.order && p.order !== 'desc') q.set('order', p.order);
    if (p.minPrice !== '') q.set('minPrice', p.minPrice);
    if (p.maxPrice !== '') q.set('maxPrice', p.maxPrice);
    if (p.bedrooms !== '') q.set('bedrooms', p.bedrooms);
    if (p.city) q.set('city', p.city);
    return q;
  };

  const updateParams = (patch) => setParams((s) => ({ ...s, ...patch }));

  // 1) URL changed (back/forward, home search, category links) → sync state + fetch.
  useEffect(() => {
    const fromUrl = JSON.stringify(getParamsFromUrl());
    if (fromUrl !== paramsKey) setParams(getParamsFromUrl());

    const urlParams = new URLSearchParams(location.search);
    let cancelled = false;

    const fetchListings = async () => {
      setLoading(true);
      setShowMore(false);
      try {
        const res = await fetch(`/api/listing/get?${urlParams.toString()}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.success === false) {
          setListings([]);
          setTotal(0);
          setShowMore(false);
          setLoading(false);
          return;
        }
        const resultListings = Array.isArray(data) ? data : data.listings || [];
        setTotal(Array.isArray(data) ? resultListings.length : data.total ?? resultListings.length);
        setShowMore(Array.isArray(data) ? resultListings.length > 8 : Boolean(data.hasMore));
        setListings(resultListings);
        setLoading(false);
      } catch (error) {
        console.log(error);
        if (!cancelled) setLoading(false);
      }
    };

    fetchListings();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // 2) Filter edits → debounced instant apply (push URL, still deep-linkable).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(() => {
      const next = buildSearchQuery(params).toString();
      const cur = new URLSearchParams(location.search).toString();
      if (next !== cur) navigate(`/search?${next}`);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey, location.search]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    const q = buildSearchQuery(params).toString();
    navigate(`/search?${q}`);
    setShowFilters(false);
  };

  const clearAll = () => setParams({ ...DEFAULT_PARAMS });

  const activeChips = [];
  if (params.searchTerm) {
    activeChips.push({ id: 'searchTerm', label: `"${params.searchTerm}"`, remove: () => updateParams({ searchTerm: '' }) });
  }
  if (params.type !== 'all') {
    activeChips.push({ id: 'type', label: params.type === 'rent' ? 'Rent' : 'Sale', remove: () => updateParams({ type: 'all' }) });
  }
  const min = params.minPrice !== '' ? Number(params.minPrice) : null;
  const max = params.maxPrice !== '' ? Number(params.maxPrice) : null;
  if (min !== null || max !== null) {
    activeChips.push({
      id: 'price',
      label: `${min !== null ? inr(min) : 'Under'} – ${max !== null ? inr(max) : 'Any'}`,
      remove: () => updateParams({ minPrice: '', maxPrice: '' }),
    });
  }
  if (params.bedrooms !== '') {
    activeChips.push({
      id: 'bedrooms',
      label: params.bedrooms === '0' ? 'Studio' : `${params.bedrooms} BHK+`,
      remove: () => updateParams({ bedrooms: '' }),
    });
  }
  if (params.city) activeChips.push({ id: 'city', label: params.city, remove: () => updateParams({ city: '' }) });
  if (params.parking) activeChips.push({ id: 'parking', label: 'Parking', remove: () => updateParams({ parking: false }) });
  if (params.furnished) activeChips.push({ id: 'furnished', label: 'Furnished', remove: () => updateParams({ furnished: false }) });
  if (params.offer) activeChips.push({ id: 'offer', label: 'Offer', remove: () => updateParams({ offer: false }) });

  const toggleDensity = () => {
    setDense((d) => {
      const next = !d;
      localStorage.setItem('oasis:grid-density', next ? 'compact' : 'comfortable');
      return next;
    });
  };

  const handleSort = (sort, order) => updateParams({ sort, order });

  const presetKey = params.type === 'sale' ? 'sale' : 'rent';
  const presets = PRICE_PRESETS[presetKey];

  const onShowMoreClick = async () => {
    const startIndex = listings.length;
    const q = new URLSearchParams(location.search);
    q.set('startIndex', startIndex);
    try {
      const res = await fetch(`/api/listing/get?${q.toString()}`);
      const data = await res.json();
      const more = Array.isArray(data) ? data : data.listings || [];
      setListings((l) => [...l, ...more]);
      if (more.length < 9) setShowMore(false);
    } catch (error) {
      console.log(error);
    }
  };

  const isSortActive = (sort, order) => params.sort === sort && (order === null || params.order === order);

  return (
    <div className='flex flex-col md:flex-row min-h-screen' style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <h1 className='sr-only'>Search Properties</h1>

      {/* ── SIDEBAR FILTERS ── */}
      <div
        className={`fixed inset-0 z-40 md:static md:z-auto md:min-h-screen md:w-[300px] border-r shadow-xl overflow-y-auto transition-transform transform ${showFilters ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
      >
        <div className='flex justify-between items-center md:hidden mb-2 border-b px-6 py-4' style={{ borderColor: 'var(--border-primary)' }}>
          <h2 className='text-xl font-bold' style={{ color: 'var(--text-primary)' }}>Filters</h2>
          <button aria-label='Close Filters' onClick={() => setShowFilters(false)} className='hover:opacity-80 text-2xl font-bold' style={{ color: 'var(--text-secondary)' }}>&times;</button>
        </div>

        <form onSubmit={onSearchSubmit} className='flex flex-col gap-7 p-6'>
          {/* Location */}
          <div className='flex flex-col gap-2'>
            <SectionLabel>Search Location / Property</SectionLabel>
            <div className='relative'>
              <FaSearchLocation className='absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-sm' />
              <input
                type='text'
                value={params.searchTerm}
                onChange={(e) => updateParams({ searchTerm: e.target.value })}
                placeholder='e.g. "Villa" or "Mumbai"'
                className='border rounded-lg pl-10 pr-8 p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500'
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
              />
              {params.searchTerm && (
                <button
                  type='button'
                  aria-label='Clear search'
                  onClick={() => updateParams({ searchTerm: '' })}
                  className='absolute right-2.5 top-1/2 -translate-y-1/2 hover:opacity-70'
                  style={{ color: 'var(--text-muted)' }}
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </div>

          {/* City */}
          <div className='flex flex-col gap-2'>
            <SectionLabel>City</SectionLabel>
            <div className='flex flex-wrap gap-2'>
              <PillBtn active={!params.city} onClick={() => updateParams({ city: '' })}>All India</PillBtn>
              {CITIES.map((c) => (
                <PillBtn key={c} active={params.city === c} onClick={() => updateParams({ city: c })}>
                  {c}
                </PillBtn>
              ))}
            </div>
          </div>

          {/* Type */}
          <div className='flex flex-col gap-2'>
            <SectionLabel>Type</SectionLabel>
            <div
              className='grid grid-cols-3 gap-1 p-1 rounded-xl border'
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)' }}
            >
              {TYPE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type='button'
                  onClick={() => updateParams({ type: o.value })}
                  className={`px-1 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${params.type === o.value
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'hover:opacity-80'}`}
                  style={params.type === o.value ? {} : { color: 'var(--text-secondary)' }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className='flex flex-col gap-2'>
            <SectionLabel>Price ({presetKey === 'sale' ? 'one-time' : 'per month'})</SectionLabel>
            <div className='flex flex-wrap gap-2'>
              {presets.map((pre) => {
                const active = (params.minPrice || '') === pre.min && (params.maxPrice || '') === pre.max;
                return (
                  <PillBtn key={pre.label} active={active} onClick={() => updateParams({ minPrice: pre.min, maxPrice: pre.max })}>
                    {pre.label}
                  </PillBtn>
                );
              })}
            </div>
            <div className='grid grid-cols-2 gap-3 mt-1'>
              <div className='relative'>
                <span className='absolute left-3 top-1/2 -translate-y-1/2 text-sm' style={{ color: 'var(--text-muted)' }}>₹</span>
                <input
                  type='number'
                  min='0'
                  placeholder='Min'
                  aria-label='Minimum price'
                  value={params.minPrice}
                  onChange={(e) => updateParams({ minPrice: e.target.value })}
                  className='border rounded-lg pl-8 p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className='relative'>
                <span className='absolute left-3 top-1/2 -translate-y-1/2 text-sm' style={{ color: 'var(--text-muted)' }}>₹</span>
                <input
                  type='number'
                  min='0'
                  placeholder='Max'
                  aria-label='Maximum price'
                  value={params.maxPrice}
                  onChange={(e) => updateParams({ maxPrice: e.target.value })}
                  className='border rounded-lg pl-8 p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          </div>

          {/* Bedrooms */}
          <div className='flex flex-col gap-2'>
            <SectionLabel>Bedrooms</SectionLabel>
            <div className='flex flex-wrap gap-2'>
              {BEDROOM_OPTIONS.map((o) => (
                <PillBtn key={o.label} active={params.bedrooms === o.value} onClick={() => updateParams({ bedrooms: o.value })}>
                  {o.label}
                </PillBtn>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div className='flex flex-col gap-2'>
            <SectionLabel>Amenities</SectionLabel>
            <div className='flex flex-wrap gap-x-6 gap-y-3'>
              {AMENITIES.map((a) => (
                <label key={a.key} className='flex items-center gap-2 cursor-pointer select-none'>
                  <input
                    type='checkbox'
                    checked={params[a.key]}
                    onChange={() => updateParams({ [a.key]: !params[a.key] })}
                    className='w-4 h-4 accent-indigo-500'
                  />
                  <span className='text-sm font-medium' style={{ color: 'var(--text-primary)' }}>{a.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type='button'
            onClick={clearAll}
            className='w-full p-2.5 rounded-lg font-semibold text-sm border transition-all hover:opacity-80'
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', borderColor: 'var(--border-primary)' }}
          >
            Clear all filters
          </button>
        </form>
      </div>

      {/* Mobile backdrop */}
      {showFilters && (
        <div onClick={() => setShowFilters(false)} className='fixed inset-0 bg-black bg-opacity-70 z-30 md:hidden'></div>
      )}

      {/* ── RESULTS ── */}
      <div className='flex-1 min-w-0'>
        <div
          className='shadow-md p-5 border-b sticky top-0 z-20 flex flex-col gap-4'
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
        >
          <div className='flex items-center justify-between gap-3 w-full'>
            <div className='min-w-0'>
              <h2 className='text-xl sm:text-2xl font-bold truncate' style={{ color: 'var(--text-heading)' }}>
                {loading ? 'Searching…' : `${total} ${total === 1 ? 'property' : 'properties'} found`}
              </h2>
              {activeChips.length > 0 && !loading && (
                <p className='text-xs mt-0.5 truncate' style={{ color: 'var(--text-muted)' }}>
                  {activeChips.length} active {activeChips.length === 1 ? 'filter' : 'filters'}
                </p>
              )}
            </div>

            <div className='flex items-center gap-2 shrink-0'>
              <button
                onClick={() => setShowFilters(true)}
                className='md:hidden flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm shadow-sm border hover:opacity-80'
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
              >
                <FaFilter className='text-sm' /> Filters
              </button>
              <button
                onClick={toggleDensity}
                title={dense ? 'Switch to comfortable grid' : 'Switch to compact grid'}
                aria-label={dense ? 'Switch to comfortable grid' : 'Switch to compact grid'}
                className='flex items-center justify-center w-9 h-9 rounded-full text-sm border hover:opacity-80'
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
              >
                {dense ? <FaTh /> : <FaThLarge />}
              </button>
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-2 text-sm'>
            <span className='font-semibold hidden lg:inline' style={{ color: 'var(--text-muted)' }}>Sort:</span>
            <button
              onClick={() => handleSort('created_at', 'desc')}
              className={`px-4 py-1.5 rounded-full transition-all border ${isSortActive('created_at', null)
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'hover:opacity-80'}`}
              style={isSortActive('created_at', null) ? {} : { color: 'var(--text-secondary)' }}
            >
              Latest
            </button>
            <button
              onClick={() => handleSort('regularPrice', 'asc')}
              className={`px-4 py-1.5 rounded-full transition-all border ${isSortActive('regularPrice', 'asc')
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'hover:opacity-80'}`}
              style={isSortActive('regularPrice', 'asc') ? {} : { color: 'var(--text-secondary)' }}
            >
              Price ↑
            </button>
            <button
              onClick={() => handleSort('regularPrice', 'desc')}
              className={`px-4 py-1.5 rounded-full transition-all border ${isSortActive('regularPrice', 'desc')
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'hover:opacity-80'}`}
              style={isSortActive('regularPrice', 'desc') ? {} : { color: 'var(--text-secondary)' }}
            >
              Price ↓
            </button>
          </div>
        </div>

        {/* Active filter chips */}
        {activeChips.length > 0 && !loading && (
          <div className='flex flex-wrap items-center gap-2 px-5 py-3 border-b' style={{ borderColor: 'var(--border-primary)' }}>
            {activeChips.map((chip) => (
              <button
                key={chip.id}
                onClick={chip.remove}
                className='flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all hover:opacity-80'
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
              >
                <FaTimes className='text-[10px]' style={{ color: 'var(--text-muted)' }} />
                {chip.label}
              </button>
            ))}
            <button
              onClick={clearAll}
              className='text-xs font-semibold underline hover:opacity-70'
              style={{ color: 'var(--text-secondary)' }}
            >
              Clear all
            </button>
          </div>
        )}

        <div className={`p-5 sm:p-7 grid ${dense ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'}`}>
          {loading &&
            Array.from({ length: dense ? 8 : 9 }).map((_, i) => <SkeletonCard key={i} dense={dense} />)}

          {!loading && listings.length === 0 && (
            <div className='flex flex-col items-center justify-center w-full py-20 text-center gap-3'>
              <div className='w-20 h-20 rounded-full flex items-center justify-center' style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <FaSearchLocation className='text-4xl opacity-50' />
              </div>
              <p className='text-xl font-semibold' style={{ color: 'var(--text-heading)' }}>
                No listings match these filters
              </p>
              <p className='text-sm max-w-sm' style={{ color: 'var(--text-muted)' }}>
                Try widening your price range, clearing a city filter, or removing an amenity.
              </p>
              <button
                onClick={clearAll}
                className='mt-3 px-6 py-2.5 rounded-full font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20'
              >
                Clear all filters
              </button>
            </div>
          )}

          {!loading &&
            listings.map((listing) => (
              <ListingItem key={listing._id} listing={listing} dense={dense} />
            ))}

          {showMore && !loading && (
            <div className='col-span-full flex justify-center pt-2'>
              <button
                onClick={onShowMoreClick}
                className='px-8 py-3 rounded-full font-semibold text-sm border transition-all hover:opacity-80'
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
              >
                Load more properties
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}