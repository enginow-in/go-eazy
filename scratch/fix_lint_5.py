import re

def fix_file(path, replacements):
    with open(path, 'r', encoding='utf8') as f:
        content = f.read()
    for p, r in replacements:
        content = re.sub(p, r, content, flags=re.MULTILINE)
    with open(path, 'w', encoding='utf8') as f:
        f.write(content)

# 1. err in ServiceProviderDashboard.jsx
fix_file('src/pages/ServiceProviderDashboard.jsx', [
    (r'catch \{\n\s*toast\.error\(err\.message', 'catch (err) {\n      toast.error(err.message')
])

# 2. Safely remove
# numBeds
fix_file('src/components/property/PropertyCard.jsx', [
    (r'^\s*const numBeds = [^\n]+\n', '')
])
# cn
fix_file('src/pages/LandlordDashboard.jsx', [
    (r'^\s*import \{ cn \} from \'../utils/helpers\'\n', '')
])
# otherImages
fix_file('src/pages/PropertyDetail.jsx', [
    (r'^\s*const otherImages = \[\]\n', '')
])

# 3. Search.jsx unused eslint-disable
fix_file('src/pages/Search.jsx', [
    (r'^\s*// eslint-disable-next-line react-hooks/exhaustive-deps\n\s*if \(!Array\.isArray', '    if (!Array.isArray')
])

# 4. useEffect warnings
# NearbyServices
fix_file('src/pages/NearbyServices.jsx', [
    (r'const updateFilters = \(key, value\) => \{', 'const updateFilters = useCallback((key, value) => {'),
    (r'\}\s+  // eslint-disable-next-line react-hooks/exhaustive-deps\n\s*\}, \[searchParams\]\)', '}, [])\n\n  useEffect(() => {\n    if (searchParams.toString() !== lastSearchRef.current) {\n      const newFilters = {\n        category: searchParams.get(\'category\') || \'all\',\n        query: searchParams.get(\'query\') || \'\'\n      }\n      setFilters(newFilters)\n      lastSearchRef.current = searchParams.toString()\n    }\n  }, [searchParams, filters.category, updateFilters])')
])
# PropertyEdit.jsx
fix_file('src/pages/PropertyEdit.jsx', [
    (r'  // eslint-disable-next-line react-hooks/exhaustive-deps\n  \}, \[id, user, navigate\]\)', '  }, [id, user, navigate, fetchPropertyById])')
])
# SavedProperties.jsx
fix_file('src/pages/SavedProperties.jsx', [
    (r'  // eslint-disable-next-line react-hooks/exhaustive-deps\n  \}, \[user, favorites\]\)', '  }, [user, favorites, loadProperties])')
])
# SystemAdmin.jsx
fix_file('src/pages/SystemAdmin.jsx', [
    (r'  // eslint-disable-next-line react-hooks/exhaustive-deps\n  \}, \[user\]\)', '  }, [user, role, loadProviders, loadStats])')
])

# 5. useAuth.js
fix_file('src/hooks/useAuth.js', [
    (r'  // eslint-disable-next-line react-hooks/exhaustive-deps\n  \}, \[\]\)', '  // eslint-disable-next-line react-hooks/exhaustive-deps -- dispatch is stable from context; fetchProfile intentionally runs only on mount/auth change\n  }, [])')
])

# 6. Search.jsx useCallback
fix_file('src/pages/Search.jsx', [
    (r'const renderFilterContent = \(\) => \{', 'const renderFilterContent = useCallback(() => {'),
    (r'  \}\n\n  const filterContent = renderFilterContent\(\) // removed useMemo as it caused lint warnings and isn\'t critical', '  }, [localFilters, t, dispatch, showFilters])\n\n  const filterContent = useMemo(() => renderFilterContent(), [renderFilterContent])')
])

print("Python script 5 applied.")
