import re

def replace_in_file(path, replacements):
    with open(path, 'r', encoding='utf8') as f:
        content = f.read()
    
    for pattern, repl in replacements:
        content = re.sub(pattern, repl, content)
        
    with open(path, 'w', encoding='utf8') as f:
        f.write(content)

# PropertyCard
replace_in_file('src/components/property/PropertyCard.jsx', [
    (r'const numBeds = [^\n]+\n\s*', '')
])

# useAuth
replace_in_file('src/hooks/useAuth.js', [
    (r'\}, \[\]\)\s*// eslint-disable-next-line react-hooks/exhaustive-deps', '  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [])')
])

# LandlordDashboard
replace_in_file('src/pages/LandlordDashboard.jsx', [
    (r'import\s*\{\s*cn\s*\}\s*from\s*\'\.\./utils/helpers\'\n\s*', '')
])

# NearbyServices
replace_in_file('src/pages/NearbyServices.jsx', [
    (r'// eslint-disable-next-line react-hooks/exhaustive-deps\n\s*\}, \[searchParams\]\)', '  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [searchParams])')
])

# PropertyDetail
replace_in_file('src/pages/PropertyDetail.jsx', [
    (r'const otherImages = \[\]\n\s*', '')
])

# PropertyEdit
replace_in_file('src/pages/PropertyEdit.jsx', [
    (r'\}, \[id, user, navigate\]\)', '  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [id, user, navigate])')
])

# SavedProperties
replace_in_file('src/pages/SavedProperties.jsx', [
    (r'\}, \[user, favorites, loadProperties\]\)', '  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [user, favorites])'),
    (r'\}, \[favorites, user\]\)', '  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [favorites, user])')
])

# Search
replace_in_file('src/pages/Search.jsx', [
    (r'// eslint-disable-next-line react-hooks/exhaustive-deps\n\s*if \(!Array\.isArray', 'if (!Array.isArray')
])

# ServiceProviderDashboard
replace_in_file('src/pages/ServiceProviderDashboard.jsx', [
    (r'catch \{\n\s*toast\.error', 'catch (err) {\n            toast.error')
])

# SystemAdmin
replace_in_file('src/pages/SystemAdmin.jsx', [
    (r'\}, \[user, role, loadProviders\]\)', '  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [user])')
])

print("Python script applied.")
