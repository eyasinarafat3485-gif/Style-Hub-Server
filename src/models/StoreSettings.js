const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  badge: { type: String, default: '' },
  description: { type: String, default: '' },
  accountNumber: { type: String, default: '' },
  instructions: { type: String, default: '' },
  icon: { type: String, default: 'banknote' }, // 'banknote', 'mobile', 'card', 'wallet'
  enabled: { type: Boolean, default: true },
});

const storeSettingsSchema = new mongoose.Schema(
  {
    storeName: { type: String, default: 'StyleHub Fashion' },
    supportEmail: { type: String, default: 'support@stylehub.com' },
    supportPhone: { type: String, default: '+880 1700-000000' },
    storeAddress: { type: String, default: 'Dhanmondi, Dhaka, Bangladesh' },
    currency: {
      code: { type: String, default: 'BDT' },
      symbol: { type: String, default: '৳' },
      name: { type: String, default: 'Bangladeshi Taka' },
    },
    shipping: {
      insideDhakaFee: { type: Number, default: 60 },
      outsideDhakaFee: { type: Number, default: 120 },
      freeShippingThreshold: { type: Number, default: 3000 },
      estimatedDeliveryInside: { type: String, default: '24-48 Hours' },
      estimatedDeliveryOutside: { type: String, default: '2-4 Days' },
    },
    paymentMethods: {
      type: [paymentMethodSchema],
      default: [
        {
          id: 'cod',
          name: 'Cash on Delivery',
          badge: 'Most Popular',
          description: 'পণ্য হাতে পেয়ে দেখে মূল্য পরিশোধ করুন। সারা বাংলাদেশে হোম ডেলিভারি সুবিধা।',
          accountNumber: '',
          instructions: 'ডেলিভারি রাইডারের কাছে পার্সেল গ্রহণের পর সঠিক টাকা প্রদান করুন।',
          icon: 'banknote',
          enabled: true,
        },
        {
          id: 'bkash_nagad',
          name: 'bKash / Nagad Personal (+8801304513475)',
          badge: '0% Extra Fee',
          description: 'বিকাশ বা নগদ পার্সোনাল নাম্বারে Send Money করে অর্ডার কনফার্ম করুন।',
          accountNumber: '+8801304513475',
          instructions: 'bKash/Nagad অ্যাপ থেকে Send Money অপশনে গিয়ে +8801304513475 নাম্বারে পেমেন্ট করুন এবং TrxID ও প্রেরক নাম্বার প্রদান করুন।',
          icon: 'mobile',
          enabled: true,
        },
        {
          id: 'card_payment',
          name: 'Online Card / SSLCommerz',
          badge: 'Secure SSL',
          description: 'যেকোনো ভিসা, মাস্টারকার্ড, বা ইসলামিক কার্ডের মাধ্যমে ১০০% নিরাপদ অনলাইন পেমেন্ট।',
          accountNumber: '',
          instructions: 'SSLCommerz এনক্রিপ্টেড পেমেন্ট গেটওয়ের মাধ্যমে নিরাপদে পে করুন।',
          icon: 'card',
          enabled: true,
        },
      ],
    },
    orderNotifications: {
      emailAlerts: { type: Boolean, default: true },
      smsAlerts: { type: Boolean, default: true },
      notificationEmail: { type: String, default: 'admin@stylehub.com' },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StoreSettings', storeSettingsSchema);
