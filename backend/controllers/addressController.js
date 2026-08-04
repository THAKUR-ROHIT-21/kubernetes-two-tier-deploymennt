import asyncHandler from 'express-async-handler';
import Address from '../models/Address.js';

// @desc    Get all addresses for the logged-in user
// @route   GET /api/addresses
export const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.findAll({
    where: { userId: req.user.id },
    order: [
      ['isDefault', 'DESC'],
      ['createdAt', 'DESC'],
    ],
  });
  res.status(200).json({ success: true, addresses });
});

// @desc    Add a new address
// @route   POST /api/addresses
export const createAddress = asyncHandler(async (req, res) => {
  const { label, fullName, phone, street, city, state, postalCode, country, isDefault } = req.body;

  if (!fullName || !phone || !street || !city || !state || !postalCode) {
    res.status(400);
    throw new Error('Please fill in all required address fields');
  }

  const existingCount = await Address.count({ where: { userId: req.user.id } });
  const shouldBeDefault = existingCount === 0 || isDefault === true;

  if (shouldBeDefault) {
    await Address.update({ isDefault: false }, { where: { userId: req.user.id } });
  }

  const address = await Address.create({
    userId: req.user.id,
    label,
    fullName,
    phone,
    street,
    city,
    state,
    postalCode,
    country,
    isDefault: shouldBeDefault,
  });

  res.status(201).json({ success: true, address });
});

// @desc    Update an existing address
// @route   PUT /api/addresses/:id
export const updateAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ where: { id: req.params.id, userId: req.user.id } });

  if (!address) {
    res.status(404);
    throw new Error('Address not found');
  }

  const { label, fullName, phone, street, city, state, postalCode, country, isDefault } = req.body;

  if (isDefault === true && !address.isDefault) {
    await Address.update({ isDefault: false }, { where: { userId: req.user.id } });
  }

  address.label = label ?? address.label;
  address.fullName = fullName ?? address.fullName;
  address.phone = phone ?? address.phone;
  address.street = street ?? address.street;
  address.city = city ?? address.city;
  address.state = state ?? address.state;
  address.postalCode = postalCode ?? address.postalCode;
  address.country = country ?? address.country;
  if (isDefault === true) address.isDefault = true;

  await address.save();

  res.status(200).json({ success: true, address });
});

// @desc    Delete an address
// @route   DELETE /api/addresses/:id
export const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ where: { id: req.params.id, userId: req.user.id } });

  if (!address) {
    res.status(404);
    throw new Error('Address not found');
  }

  const wasDefault = address.isDefault;
  await address.destroy();

  if (wasDefault) {
    const nextAddress = await Address.findOne({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    if (nextAddress) {
      nextAddress.isDefault = true;
      await nextAddress.save();
    }
  }

  res.status(200).json({ success: true, message: 'Address deleted' });
});

// @desc    Set a specific address as the default
// @route   PATCH /api/addresses/:id/default
export const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ where: { id: req.params.id, userId: req.user.id } });

  if (!address) {
    res.status(404);
    throw new Error('Address not found');
  }

  await Address.update({ isDefault: false }, { where: { userId: req.user.id } });
  address.isDefault = true;
  await address.save();

  res.status(200).json({ success: true, address });
});