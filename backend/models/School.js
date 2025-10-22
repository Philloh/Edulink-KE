const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, index: true },
  location: { type: String, required: true, trim: true },
  type: { type: String, enum: ['public', 'private'], required: true, index: true },
  emisCode: { type: String, trim: true, unique: true, sparse: true },
  contactEmail: { type: String, trim: true },
  contactPhone: { type: String, trim: true },
  address: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('School', schoolSchema);


