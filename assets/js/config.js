/**
 * OINST — Tool registry
 * ---------------------------------------------------------------
 * Single source of truth for every lookup section on the page.
 * The HTML sections, the navigation pills and the client-side
 * validation are all generated from this array.
 */

const TOOLS = [
  {
    id: 'vehicle-rc',
    cmd: 'vehicle',
    label: 'Vehicle RC',
    icon: 'registration',
    kind: 'vehicle',
    tagline: 'Registration Certificate',
    description:
      'Pull the registration certificate record for any Indian vehicle number — registration date, RTO, fuel type, chassis & engine info.',
    placeholder: 'WB26W3880',
    example: 'WB26W3880',
  },
  {
    id: 'vehicle-info',
    cmd: 'vehicleinfo',
    label: 'Vehicle Info',
    icon: 'car',
    kind: 'vehicle',
    tagline: 'Owner & Vehicle Details',
    description:
      'Resolve owner name, maker/model, registration authority, insurance validity and fitness details for a vehicle number.',
    placeholder: 'HR26EV0001',
    example: 'HR26EV0001',
  },
  {
    id: 'vehicle-challan',
    cmd: 'vehiclechallan',
    label: 'Vehicle Challan',
    icon: 'receipt',
    kind: 'vehicle',
    tagline: 'Traffic Challans & Fines',
    description:
      'Check pending traffic challans, fines, offence dates and court/payment status linked to a vehicle number.',
    placeholder: 'HR26EV0001',
    example: 'HR26EV0001',
  },
  {
    id: 'vehicle-all',
    cmd: 'vehicleall',
    label: 'Vehicle All',
    icon: 'layers',
    kind: 'vehicle',
    tagline: 'Complete Vehicle Bundle',
    description:
      'One call, full vehicle intelligence — RC, owner info and challans merged into a single combined report.',
    placeholder: 'HR26EV0001',
    example: 'HR26EV0001',
  },
  {
    id: 'phone-info',
    cmd: 'phoneinfo',
    label: 'Phone Info',
    icon: 'phone',
    kind: 'phone',
    tagline: 'Mobile Intelligence',
    description:
      'Mobile number intelligence — operator, circle, network type and linked subscriber information.',
    placeholder: '9093614290',
    example: '9093614290',
  },
  {
    id: 'number',
    cmd: 'number',
    label: 'Number',
    icon: 'search',
    kind: 'phone',
    tagline: 'Number Lookup',
    description:
      'General number lookup returning operator, region and reference details for a 10-digit Indian mobile number.',
    placeholder: '9093614290',
    example: '9093614290',
  },
  {
    id: 'hp',
    cmd: 'hp',
    label: 'HP',
    icon: 'device',
    kind: 'phone',
    tagline: 'HP / Handset Lookup',
    description:
      'Handset / HP oriented number lookup, useful for quick device & subscriber reference checks.',
    placeholder: '7074578844',
    example: '7074578844',
  },
  {
    id: 'upi',
    cmd: 'upi',
    label: 'UPI',
    icon: 'wallet',
    kind: 'upi',
    tagline: 'UPI ID Verification',
    description:
      'Verify a UPI VPA (like name@bank) and reveal the registered account holder name and linked bank handle.',
    placeholder: '9593964430@ibl',
    example: '9593964430@ibl',
  },
  {
    id: 'pan',
    cmd: 'pan',
    label: 'PAN',
    icon: 'idcard',
    kind: 'pan',
    tagline: 'PAN Card Details',
    description:
      'Fetch PAN card holder details — name, PAN type, status and reference data from the PAN number.',
    placeholder: 'CFXPV5799D',
    example: 'CFXPV5799D',
  },
  {
    id: 'pan-v2',
    cmd: 'pan2',
    label: 'PAN v2',
    icon: 'idcard',
    kind: 'pan',
    tagline: 'Enhanced PAN Lookup',
    description:
      'Second-generation PAN lookup with an extended, more detailed response payload for the same PAN number.',
    placeholder: 'BBGPP5787F',
    example: 'BBGPP5787F',
  },
  {
    id: 'telegram',
    cmd: 'tg',
    label: 'Telegram',
    icon: 'send',
    kind: 'telegram',
    tagline: 'Telegram Account Lookup',
    description:
      'Resolve a Telegram numeric user ID into profile details — username, name and account identifiers.',
    placeholder: '8269316828',
    example: '8269316828',
  },
  {
    id: 'family',
    cmd: 'family',
    label: 'Family',
    icon: 'users',
    kind: 'aadhaar',
    tagline: 'Family / Relations',
    description:
      'Family and relation mapping lookup based on an Aadhaar-linked reference number.',
    placeholder: '672459048432',
    example: '672459048432',
  },
  {
    id: 'aadhaar',
    cmd: 'aadhar',
    label: 'Aadhaar',
    icon: 'fingerprint',
    kind: 'aadhaar',
    tagline: 'Aadhaar Reference Lookup',
    description:
      'Aadhaar based reference lookup returning the linked record details for the supplied number.',
    placeholder: '672459048432',
    example: '672459048432',
  },
  {
    id: 'all',
    cmd: 'all',
    label: 'All',
    icon: 'sparkles',
    kind: 'phone',
    tagline: 'Master Lookup',
    description:
      'Master lookup — combines every available source into one consolidated intelligence report.',
    placeholder: '9093614290',
    example: '9093614290',
  },
];

// Expose to the browser without a bundler.
window.OINST_TOOLS = TOOLS;
