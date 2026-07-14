import os

def replace_exact(path, old, new):
    with open(path, 'r', encoding='utf8') as f:
        content = f.read()
    if old in content:
        content = content.replace(old, new)
        with open(path, 'w', encoding='utf8') as f:
            f.write(content)
    else:
        print(f"COULD NOT FIND IN {path}")

# 1. useAuth.js
replace_exact('src/hooks/useAuth.js', 
    '    return () => subscription.unsubscribe()\n  }, [])',
    '    return () => subscription.unsubscribe()\n    // eslint-disable-next-line react-hooks/exhaustive-deps -- dispatch is stable from context; fetchProfile intentionally runs only on mount/auth change\n  }, [])')

replace_exact('src/hooks/useAuth.js',
    '    // eslint-disable-next-line react-hooks/exhaustive-deps\n    const { data: { subscription } } =',
    '    const { data: { subscription } } =')

# 2. NearbyServices.jsx
replace_exact('src/pages/NearbyServices.jsx',
    '  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [])\n\n  useEffect(() => {\n    if (searchParams.toString() !== lastSearchRef.current) {\n      const newFilters = {\n        category: searchParams.get(\'category\') || \'all\',\n        query: searchParams.get(\'query\') || \'\'\n      }\n      setFilters(newFilters)\n      lastSearchRef.current = searchParams.toString()\n    }\n  }, [searchParams, filters.category, updateFilters])',
    '  }, [])') # Revert previous bad edit

# 3. PropertyEdit.jsx
replace_exact('src/pages/PropertyEdit.jsx',
    '  }, [id, user, navigate, fetchPropertyById])',
    '  }, [id, user, navigate, fetchPropertyById])') # Already done right

# 4. SavedProperties.jsx
replace_exact('src/pages/SavedProperties.jsx',
    '  }, [user, favorites, loadProperties])',
    '  }, [user, favorites, loadProperties])') # Already done right

# 5. SystemAdmin.jsx
replace_exact('src/pages/SystemAdmin.jsx',
    '  }, [user, role, loadProviders, loadStats])',
    '  }, [user, role, loadProviders, loadStats])') # Already done right

# 6. PropertyDetail.jsx (otherImages was removed, check if any remained)
replace_exact('src/pages/PropertyDetail.jsx',
    '  const otherImages = []\n',
    '')

print("Python script 6 applied.")
