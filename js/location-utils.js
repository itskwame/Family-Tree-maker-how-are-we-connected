const normalizeValue = (value) => {
    const cleaned = value?.trim();
    return cleaned ? cleaned : null;
};

export function normalizeLocationInput(city, state, country, zip) {
    return {
        city: normalizeValue(city),
        state: normalizeValue(state),
        country: normalizeValue(country),
        zip: normalizeValue(zip)
    };
}

export function buildLocationLabel(location = {}) {
    const parts = [];
    if (location.city) parts.push(location.city);
    if (location.state) parts.push(location.state);
    if (location.country) parts.push(location.country);

    const base = parts.join(', ');
    if (!base) return '';

    if (location.zip) {
        return `${base} (${location.zip})`;
    }
    return base;
}

export function buildProfileLocationHeading(location = {}) {
    const hasCity = Boolean(location.city);
    const hasState = Boolean(location.state);
    const hasCountry = Boolean(location.country);

    let base = '';
    if (hasCity && hasState) {
        base = `${location.city}, ${location.state}`;
    } else if (hasCity && hasCountry) {
        base = `${location.city}, ${location.country}`;
    } else if (hasCity) {
        base = location.city;
    } else if (hasState) {
        base = location.state;
    } else if (hasCountry) {
        base = location.country;
    }

    if (!base) {
        return '';
    }

    if (location.zip) {
        return `${base} (${location.zip})`;
    }
    return base;
}
