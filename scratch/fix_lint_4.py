import re
import os

def fix_file(path, replacements):
    with open(path, 'r', encoding='utf8') as f:
        content = f.read()
    for p, r in replacements:
        content = re.sub(p, r, content, flags=re.MULTILINE)
    with open(path, 'w', encoding='utf8') as f:
        f.write(content)

# 1. useAuth.js
fix_file('src/hooks/useAuth.js', [
    (r'  // eslint-disable-next-line react-hooks/exhaustive-deps\n  \}, \[\]\)', '  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [dispatch, fetchProfile])')
])

# 2. NearbyServices.jsx
fix_file('src/pages/NearbyServices.jsx', [
    (r'  // eslint-disable-next-line react-hooks/exhaustive-deps\n  \}, \[searchParams\]\)', '  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [searchParams, filters.category, updateFilters])')
])

# 3. PropertyEdit.jsx
fix_file('src/pages/PropertyEdit.jsx', [
    (r'  // eslint-disable-next-line react-hooks/exhaustive-deps\n  \}, \[id, user, navigate\]\)', '  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [id, user, navigate, fetchPropertyById])')
])

# 4. SavedProperties.jsx
fix_file('src/pages/SavedProperties.jsx', [
    (r'  // eslint-disable-next-line react-hooks/exhaustive-deps\n  \}, \[user, favorites\]\)', '  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [user, favorites, loadProperties])')
])

# 5. SystemAdmin.jsx
fix_file('src/pages/SystemAdmin.jsx', [
    (r'  // eslint-disable-next-line react-hooks/exhaustive-deps\n  \}, \[user\]\)', '  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [user, role, loadProviders])')
])

# 6. Search.jsx (unused eslint-disable)
fix_file('src/pages/Search.jsx', [
    (r'^\s*// eslint-disable-next-line react-hooks/exhaustive-deps\n\s*if \(\!Array', '    if (!Array')
])

# 7. PropertyCard.jsx (numBeds)
fix_file('src/components/property/PropertyCard.jsx', [
    (r'^\s*const numBeds = property\.bhk_type \? parseInt\(property\.bhk_type\.replace\(\/\[\^0-9\]\/g, \'\'\)\) : 0\r?\n?', '')
])

# 8. LandlordDashboard.jsx (cn)
fix_file('src/pages/LandlordDashboard.jsx', [
    (r'^\s*import \{ cn \} from \'../utils/helpers\'\r?\n?', '')
])

# 9. PropertyDetail.jsx (otherImages)
fix_file('src/pages/PropertyDetail.jsx', [
    (r'^\s*const otherImages = \[\]\r?\n?', '')
])

# 10. ServiceProviderDashboard.jsx (err)
fix_file('src/pages/ServiceProviderDashboard.jsx', [
    (r'catch \(err\) \{\n\s*toast\.error', 'catch {\n      toast.error')
])

print("Python script 4 applied.")
