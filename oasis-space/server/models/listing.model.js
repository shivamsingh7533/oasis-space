import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    regularPrice: {
      type: Number,
      required: true,
    },
    discountPrice: {
      type: Number,
      required: true,
    },
    bathrooms: {
      type: Number,
      required: true,
    },
    bedrooms: {
      type: Number,
      required: true,
    },
    furnished: {
      type: Boolean,
      required: true,
    },
    parking: {
      type: Boolean,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    offer: {
      type: Boolean,
      required: true,
    },
    featured: {
      type: Boolean,
      default: false, 
    },
    
    // ✅ EXISTING: Sirf URLs store karega (Purana code break na ho isliye)
    imageUrls: {
      type: Array,
      required: true,
    },

    // 👇✅ NEW: IMAGE LABELS (Living Room, Kitchen, etc.)
    // Ye 'imageUrls' ke parallel chalega. 
    // Example: Agar imageUrls[0] Kitchen ki photo hai, to imageLabels[0] "Kitchen" hoga.
    imageLabels: {
        type: Array, 
        default: [], 
    },

    userRef: {
      type: String,
      required: true,
    },
    
    // 👇✅ EXISTING: STATUS FIELD FOR ANALYTICS
    status: {
        type: String,
        enum: ['available', 'sold', 'rented'],
        default: 'available',
    },
  },
  { timestamps: true }
);

// 👇👇👇 CRASH FIX MAINTAINED 👇👇👇
const Listing = mongoose.models.Listing || mongoose.model('Listing', listingSchema);

export default Listing;