import re
import sys

def replace_in_file(path, replacements):
    with open(path, 'r', encoding='utf8') as f:
        content = f.read()
    
    for pattern, repl in replacements:
        content = re.sub(pattern, repl, content)
        
    with open(path, 'w', encoding='utf8') as f:
        f.write(content)

# PropertySection
replace_in_file('src/components/home/PropertySection.jsx', [
    (r'const \{ featured, fetchFeatured: fetchFeaturedRaw, loading: hookLoading \} = useProperties\(\)', 'const { featured, fetchFeatured: fetchFeaturedRaw } = useProperties()')
])

# PropertyCard
replace_in_file('src/components/property/PropertyCard.jsx', [
    (r'const numBeds = property\.bhk_type \? parseInt\([^\)]+\) : 0\n\s*', '')
])

# useAuth
replace_in_file('src/hooks/useAuth.js', [
    (r'\}, \[\]\)\s*// eslint-disable-next-line react-hooks/exhaustive-deps', '// eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [])')
])

# useProperties
replace_in_file('src/hooks/useProperties.js', [
    (r'\} catch \(err\) \{\n\s*dispatch\(toggleFav', '} catch {\n      dispatch(toggleFav')
])

# LandlordDashboard
replace_in_file('src/pages/LandlordDashboard.jsx', [
    (r'import \{ cn \} from \'../utils/helpers\'\n', '')
])

# NearbyServices
replace_in_file('src/pages/NearbyServices.jsx', [
    (r'const updateFilters = useCallback\(\(key, value\) => \{', 'const updateFilters = (key, value) => {'),
    (r'// eslint-disable-next-line react-hooks/exhaustive-deps\n\s*\}, \[searchParams\]\)', '}, [searchParams, filters.category])')
])

# PropertyDetail
replace_in_file('src/pages/PropertyDetail.jsx', [
    (r'import React, \{ useEffect, useState, useRef \} from \'react\'', 'import React, { useEffect, useState, useRef, useCallback } from \'react\''),
    (r'const otherImages = \[\]\n\s*', '')
])

# PropertyEdit
replace_in_file('src/pages/PropertyEdit.jsx', [
    (r'\}, \[id, user, navigate\]\)', '}, [id, user, navigate, fetchPropertyById])')
])

# SavedProperties
replace_in_file('src/pages/SavedProperties.jsx', [
    (r'const loadProperties = async \(\) => \{', 'const loadProperties = React.useCallback(async () => {'),
    (r'\} finally \{\n\s*setLoading\(false\)\n\s*\}\n\s*\}', '} finally {\n      setLoading(false)\n    }\n  }, [favorites, user])'),
    (r'\}, \[user, favorites, loadProperties\]\)', '}, [user, favorites, loadProperties])')
])

# Search
replace_in_file('src/pages/Search.jsx', [
    (r'// eslint-disable-next-line react-hooks/exhaustive-deps\n\s*if \(\!Array\.isArray', 'if (!Array.isArray'),
    (r'const filterContent = useMemo\(\(\) => renderFilterContent\(\), \[localFilters, t, dispatch, showFilters\]\)', 'const filterContent = renderFilterContent() // removed useMemo as it caused lint warnings and isn\'t critical')
])

# ServiceProviderDashboard
replace_in_file('src/pages/ServiceProviderDashboard.jsx', [
    (r'import React, \{ useEffect, useState \} from \'react\'', 'import React, { useEffect, useState, useCallback } from \'react\''),
    (r'catch \(err\) \{\n\s*console\.error\(err\)\n\s*toast\.error\(\'Payment failed\'\)', 'catch {\n            toast.error(\'Payment failed\')')
])

# SystemAdmin
replace_in_file('src/pages/SystemAdmin.jsx', [
    (r'const loadProviders = async \(\) => \{', 'const loadProviders = React.useCallback(async () => {'),
    (r'\} finally \{\n\s*setLoadingProviders\(false\)\n\s*\}\n\s*\}', '} finally {\n      setLoadingProviders(false)\n    }\n  }, [getAdminPendingServices])'),
    (r'// eslint-disable-next-line react-hooks/exhaustive-deps\n\s*\}, \[user\]\)', '}, [user, role, loadProviders])')
])

print("Python script applied.")
