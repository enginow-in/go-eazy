export const getPropertyBreadcrumbs = (property) => {
  if (!property) return [];
  
  return [
    { label: 'Home', href: '/' },
    { label: property.city || 'Search', href: `/search?city=${property.city}` },
    { label: property.title || 'Property', href: null }
  ];
};

export const getSearchBreadcrumbs = (searchParams) => {
  const crumbs = [{ label: 'Home', href: '/' }];
  if (searchParams.get('city')) {
    crumbs.push({ label: searchParams.get('city'), href: `/search?city=${searchParams.get('city')}` });
  }
  return crumbs;
};