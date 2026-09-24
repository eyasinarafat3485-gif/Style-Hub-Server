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

const heroSlideSchema = new mongoose.Schema({
  id: { type: String, default: () => 'slide_' + Date.now().toString(36) },
  badge: { type: String, default: 'NEW SEASON 2025' },
  titleStart: { type: String, default: 'STYLE THAT SPEAKS ' },
  titleHighlight: { type: String, default: 'YOU' },
  subtitle: { type: String, default: 'Premium quality outfits for every occasion. Comfort. Style. Confidence.' },
  image: { type: String, default: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&auto=format&fit=crop&q=80' },
  primaryBtnText: { type: String, default: 'Shop Men' },
  primaryBtnLink: { type: String, default: '/men' },
  secondaryBtnText: { type: String, default: 'Shop Women' },
  secondaryBtnLink: { type: String, default: '/women' },
  bgGradient: { type: String, default: 'from-stone-100 via-rose-50/40 to-amber-50/30' },
  active: { type: Boolean, default: true },
});

const promoBannerSchema = new mongoose.Schema({
  id: { type: String, default: () => 'promo_' + Date.now().toString(36) },
  badge: { type: String, default: 'Summer Edit' },
  title: { type: String, default: 'Up to 40% Off' },
  description: { type: String, default: 'Light, breathable & fresh seasonal styles.' },
  buttonText: { type: String, default: 'Shop Now' },
  link: { type: String, default: '/shop?category=Women' },
  image: { type: String, default: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80' },
  badgeColor: { type: String, default: 'amber' }, // 'amber', 'emerald', 'rose', 'indigo'
  active: { type: Boolean, default: true },
});

const faqItemSchema = new mongoose.Schema({
  id: { type: String, default: () => 'faq_' + Date.now().toString(36) },
  category: { type: String, default: 'Orders & Delivery' },
  question: { type: String, required: true },
  answer: { type: String, required: true },
});

const trustBadgeSchema = new mongoose.Schema({
  id: { type: String, default: () => 'badge_' + Date.now().toString(36) },
  icon: { type: String, default: 'Headset' },
  title: { type: String, required: true },
  desc: { type: String, required: true },
});

const storeSettingsSchema = new mongoose.Schema(
  {
    storeName: { type: String, default: 'StyleHub Fashion' },
    supportEmail: { type: String, default: 'support@stylehub.com.bd' },
    supportPhone: { type: String, default: '+880 1711-000000' },
    storeAddress: { type: String, default: 'House 12, Road 5, Dhanmondi, Dhaka-1205, Bangladesh' },

    // Theme & Visual Aesthetics
    theme: {
      primaryColor: { type: String, default: '#ff2056' },
      secondaryColor: { type: String, default: '#e01648' },
      accentColor: { type: String, default: '#f43f5e' },
      fontFamily: { type: String, default: 'Inter' }, // 'Inter', 'Outfit', 'Poppins', 'Roboto', 'Plus Jakarta Sans'
      preset: { type: String, default: 'crimson' }, // 'crimson', 'emerald', 'indigo', 'amber', 'midnight'
      borderRadius: { type: String, default: '0.75rem' },
    },

    // Branding
    branding: {
      logoText: { type: String, default: 'StyleHub' },
      logoUrl: { type: String, default: '' },
      faviconUrl: { type: String, default: '' },
      tagline: { type: String, default: 'Wear Your Style' },
    },

    // Top Header & Announcement Bar
    topNotice: {
      enabled: { type: Boolean, default: true },
      announcements: {
        type: [String],
        default: [
          'Free Delivery on orders over ৳1499',
          '30 Days Easy Returns & Exchange',
          'Cash on Delivery Available Nationwide',
          '100% Authentic Quality Guaranteed',
          '24/7 Dedicated Help & Support',
          'New Season Collections & Trending Outfits',
        ],
      },
    },

    // Hero Carousel Slides
    heroSlider: {
      type: [heroSlideSchema],
      default: [
        {
          id: 'slide-1',
          badge: 'NEW SEASON 2025',
          titleStart: 'STYLE THAT SPEAKS ',
          titleHighlight: 'YOU',
          subtitle: 'Premium quality outfits for every occasion. Comfort. Style. Confidence.',
          image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&auto=format&fit=crop&q=80',
          primaryBtnText: 'Shop Men',
          primaryBtnLink: '/men',
          secondaryBtnText: 'Shop Women',
          secondaryBtnLink: '/women',
          bgGradient: 'from-stone-100 via-rose-50/40 to-amber-50/30',
          active: true,
        },
        {
          id: 'slide-2',
          badge: 'FESTIVE COLLECTION',
          titleStart: 'ELEGANCE IN EVERY ',
          titleHighlight: 'THREAD',
          subtitle: 'Exclusive designer Panjabis & traditional wear for Jummah, Eid & celebrations.',
          image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1000&auto=format&fit=crop&q=80',
          primaryBtnText: 'Explore Panjabi',
          primaryBtnLink: '/shop?category=Panjabi',
          secondaryBtnText: 'View All',
          secondaryBtnLink: '/shop',
          bgGradient: 'from-amber-50/60 via-stone-100 to-rose-50/30',
          active: true,
        },
        {
          id: 'slide-3',
          badge: 'MODERN STREETWEAR',
          titleStart: 'COMFORT MEETS ',
          titleHighlight: 'TRENDS',
          subtitle: 'Oversized t-shirts, polo tops and denim crafted for modern urban lifestyle.',
          image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&auto=format&fit=crop&q=80',
          primaryBtnText: 'Shop Streetwear',
          primaryBtnLink: '/shop',
          secondaryBtnText: 'New Arrivals',
          secondaryBtnLink: '/new-arrivals',
          bgGradient: 'from-stone-100 via-gray-50 to-rose-50/50',
          active: true,
        },
      ],
    },

    // Promotional Banners
    promoBanners: {
      type: [promoBannerSchema],
      default: [
        {
          id: 'promo-1',
          badge: 'Summer Edit',
          title: 'Up to 40% Off',
          description: 'Light, breathable & fresh seasonal styles.',
          buttonText: 'Shop Now',
          link: '/shop?category=Women',
          image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80',
          badgeColor: 'amber',
          active: true,
        },
        {
          id: 'promo-2',
          badge: 'Panjabi & Ethnic',
          title: 'New Arrivals',
          description: 'Exquisite designs for festive occasions.',
          buttonText: 'Explore',
          link: '/shop?category=Panjabi',
          image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80',
          badgeColor: 'emerald',
          active: true,
        },
        {
          id: 'promo-3',
          badge: 'Student Offer',
          title: 'Extra 10% Off',
          description: 'Verify your student ID & save instantly.',
          buttonText: 'Get Discount',
          link: '/shop',
          image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80',
          badgeColor: 'rose',
          active: true,
        },
      ],
    },

    // Custom Page Contents (About Us, FAQ, Trust Badges)
    pageContent: {
      aboutUs: {
        badge: { type: String, default: 'About StyleHub' },
        heroTitle: { type: String, default: 'Modern fashion designed for uncompromising quality & comfort.' },
        heroSubtitle: {
          type: String,
          default:
            'StyleHub is an independent fashion brand founded on the belief that everyday clothing should look sharp, feel effortless, and stand the test of time.',
        },
        heroImage: {
          type: String,
          default: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80',
        },
        storyHeading: { type: String, default: 'Crafted with passion, worn with pride.' },
        storyText1: {
          type: String,
          default:
            'StyleHub began with a simple observation: modern fashion in Bangladesh often forces customers to choose between exorbitant international designer price tags or low-grade fast fashion that deteriorates after a couple of washes.',
        },
        storyText2: {
          type: String,
          default:
            'We bridged that divide. By establishing direct artisan and mill partnerships across Bangladesh, we curate and produce garments using authentic, durable textiles designed for South Asian climate and lifestyle.',
        },
        values: [
          {
            num: { type: String, default: '01' },
            title: { type: String, default: 'Pure Fabric Standards' },
            desc: {
              type: String,
              default:
                'Every piece is crafted from 100% combed organic cotton, natural linen, or fine silk. Breathable, durable, and shrink-resistant.',
            },
          },
          {
            num: { type: String, default: '02' },
            title: { type: String, default: 'Ergonomic Modern Fitting' },
            desc: {
              type: String,
              default:
                'Designed with precision tailored cuts crafted specifically for South Asian ergonomics, delivering a sharp and comfortable fit.',
            },
          },
          {
            num: { type: String, default: '03' },
            title: { type: String, default: 'Customer-Centric Promises' },
            desc: {
              type: String,
              default:
                'Cash on delivery across all 64 districts with instant parcel inspection, 7-day doorstep exchange, and 24/7 support.',
            },
          },
        ],
        stats: [
          { value: { type: String, default: '50,000+' }, label: { type: String, default: 'Happy Customers' } },
          { value: { type: String, default: '100%' }, label: { type: String, default: 'Authentic Fabrics' } },
          { value: { type: String, default: '64' }, label: { type: String, default: 'Districts Covered' } },
          { value: { type: String, default: '4.9 ★' }, label: { type: String, default: 'Average Rating' } },
        ],
      },
      faq: {
        type: [faqItemSchema],
        default: [
          {
            id: 'faq-1',
            category: 'Orders & Delivery',
            question: 'How long does delivery take across Bangladesh?',
            answer:
              'Delivery inside Dhaka city usually takes 24 to 48 hours. For areas outside Dhaka (sub-districts & all 64 districts), delivery typically takes 2 to 4 business days via our trusted courier partners (Steadfast, Pathao & RedX).',
          },
          {
            id: 'faq-2',
            category: 'Orders & Delivery',
            question: 'How can I track my active order?',
            answer:
              'Once your order is confirmed, you will receive real-time status updates in your StyleHub User Dashboard under "My Orders". You will also receive an SMS with the courier tracking ID once shipped.',
          },
          {
            id: 'faq-3',
            category: 'Payments & Security',
            question: 'What payment methods do you support? Is Cash on Delivery available?',
            answer:
              'Yes! We offer 100% Cash on Delivery (COD) all over Bangladesh. We also accept instant online payments via bKash, Nagad, Rocket, Visa, Mastercard, and Debit/Credit cards with bank-grade 256-bit encryption.',
          },
          {
            id: 'faq-4',
            category: 'Returns & Exchange',
            question: 'What is your return & exchange policy?',
            answer:
              'We offer an easy 7-day hassle-free return and exchange policy! If you receive a defective item, wrong size, or are unsatisfied with the fit, simply initiate a return from your dashboard or contact our WhatsApp helpline (+880 1700-000000).',
          },
          {
            id: 'faq-5',
            category: 'Product & Quality',
            question: 'Are the products 100% authentic and premium quality?',
            answer:
              'Absolutely. Every StyleHub garment is crafted from 100% combed organic cotton, authentic linen, or pure silk fabrics. All items undergo a strict 3-stage quality inspection before packaging.',
          },
        ],
      },
      trustBadges: {
        type: [trustBadgeSchema],
        default: [
          { id: 'tb-1', icon: 'Headset', title: '24/7 Support', desc: "We're here to help" },
          { id: 'tb-2', icon: 'Truck', title: 'Free Shipping', desc: 'On orders over ৳1499' },
          { id: 'tb-3', icon: 'RotateCcw', title: '30 Days Returns', desc: 'Easy return & exchange' },
          { id: 'tb-4', icon: 'ShieldCheck', title: 'Secure Payment', desc: '100% secure checkout' },
          { id: 'tb-5', icon: 'Banknote', title: 'Cash on Delivery', desc: 'Pay at your doorstep' },
        ],
      },
    },

    // Footer Configuration
    footer: {
      aboutText: {
        type: String,
        default: 'Your one-stop destination for stylish, comfortable & premium quality clothing in Bangladesh.',
      },
      facebookUrl: { type: String, default: 'https://facebook.com' },
      instagramUrl: { type: String, default: 'https://instagram.com' },
      tiktokUrl: { type: String, default: 'https://tiktok.com' },
      youtubeUrl: { type: String, default: 'https://youtube.com' },
      copyrightText: {
        type: String,
        default: 'StyleHub Bangladesh. All Rights Reserved.',
      },
    },

    // Currency
    currency: {
      code: { type: String, default: 'BDT' },
      symbol: { type: String, default: '৳' },
      name: { type: String, default: 'Bangladeshi Taka' },
    },

    // Shipping Configuration
    shipping: {
      insideDhakaFee: { type: Number, default: 60 },
      outsideDhakaFee: { type: Number, default: 120 },
      freeShippingThreshold: { type: Number, default: 3000 },
      estimatedDeliveryInside: { type: String, default: '24-48 Hours' },
      estimatedDeliveryOutside: { type: String, default: '2-4 Days' },
    },

    // Payment Methods
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

    // Notifications
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
