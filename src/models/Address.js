const { db } = require('../config/db');

// Ensure db.addresses array is initialized
if (!db.addresses) {
  db.addresses = [];
}

class Address {
  static async find(filter = {}) {
    let results = [...(db.addresses || [])];
    if (filter.user_id) {
      results = results.filter((a) => a.user_id === filter.user_id);
    }
    if (filter.is_default !== undefined) {
      results = results.filter((a) => a.is_default === filter.is_default);
    }
    return results;
  }

  static async findById(id) {
    const list = db.addresses || [];
    return list.find((a) => String(a.id) === String(id)) || null;
  }

  static async findByUserId(user_id) {
    const list = db.addresses || [];
    return list.filter((a) => String(a.user_id) === String(user_id));
  }

  static async findDefaultByUserId(user_id) {
    const list = db.addresses || [];
    return (
      list.find((a) => String(a.user_id) === String(user_id) && a.is_default) ||
      list.find((a) => String(a.user_id) === String(user_id)) ||
      null
    );
  }

  static async create(addressData) {
    if (!db.addresses) db.addresses = [];

    // If marked default, unset default on other addresses of the user
    if (addressData.is_default) {
      db.addresses.forEach((a) => {
        if (String(a.user_id) === String(addressData.user_id)) {
          a.is_default = false;
        }
      });
    }

    const nextId = db.addresses.length > 0 ? Math.max(...db.addresses.map((a) => Number(a.id) || 0)) + 1 : 1;

    const newAddress = {
      id: nextId,
      user_id: addressData.user_id,
      full_name: addressData.full_name || '',
      phone: addressData.phone || '',
      address_line1: addressData.address_line1 || '',
      address_line2: addressData.address_line2 || '',
      city: addressData.city || '',
      state: addressData.state || '',
      postal_code: addressData.postal_code || '',
      country: addressData.country || 'India',
      address_type: addressData.address_type || 'HOME',
      is_default: !!addressData.is_default,
      created_at: new Date().toISOString(),
    };

    db.addresses.push(newAddress);
    return newAddress;
  }

  static async update(id, user_id, updateData) {
    const list = db.addresses || [];
    const index = list.findIndex(
      (a) => String(a.id) === String(id) && (!user_id || String(a.user_id) === String(user_id))
    );
    if (index === -1) return null;

    if (updateData.is_default) {
      list.forEach((a) => {
        if (String(a.user_id) === String(list[index].user_id)) {
          a.is_default = false;
        }
      });
    }

    list[index] = {
      ...list[index],
      ...updateData,
      id: list[index].id,
      user_id: list[index].user_id,
    };
    return list[index];
  }

  static async delete(id, user_id) {
    if (!db.addresses) return false;
    const index = db.addresses.findIndex(
      (a) => String(a.id) === String(id) && (!user_id || String(a.user_id) === String(user_id))
    );
    if (index === -1) return false;
    db.addresses.splice(index, 1);
    return true;
  }

  static async setDefault(id, user_id) {
    if (!db.addresses) return null;
    let target = null;
    db.addresses.forEach((a) => {
      if (String(a.user_id) === String(user_id)) {
        if (String(a.id) === String(id)) {
          a.is_default = true;
          target = a;
        } else {
          a.is_default = false;
        }
      }
    });
    return target;
  }
}

module.exports = Address;
