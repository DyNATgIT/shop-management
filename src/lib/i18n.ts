import { Language } from './types'

export const dict = {
  en: {
    appName: 'Vegetable Shop Manager', tagline: 'Fast billing, daily mandi purchase, stock, wastage and udhaar management', dashboard: 'Dashboard', billing: 'Billing', inventory: 'Vegetables', purchases: 'Mandi Purchase', wastage: 'Wastage', customers: 'Customers', suppliers: 'Suppliers', payments: 'Payments', reports: 'Reports', settings: 'Settings',
    todaySales: "Today's Sales", billsToday: 'Bills Today', stockValue: 'Stock Value', customerDue: 'Customer Due', lowStock: 'Low Stock', freshStock: 'Fresh Stock', recentBills: 'Recent Bills', dailySummary: 'Daily Summary',
    searchVegetable: 'Search vegetable / scan code', add: 'Add', save: 'Save', savePrint: 'Save & Print', print: 'Print', edit: 'Edit', delete: 'Delete', cancel: 'Cancel', export: 'Export', import: 'Import', backup: 'Backup', restore: 'Restore', reset: 'Reset',
    name: 'Name', hindiName: 'Hindi Name', category: 'Category', unit: 'Unit', barcode: 'Code', purchaseRate: 'Purchase Rate', sellingRate: 'Selling Rate', stock: 'Stock', lowStockLevel: 'Low Stock Level', wastagePercent: 'Wastage %', qty: 'Qty', rate: 'Rate', discount: 'Discount', amount: 'Amount', total: 'Total', paid: 'Paid', due: 'Due', paymentMode: 'Payment Mode', customer: 'Customer', phone: 'Phone', address: 'Address', supplier: 'Supplier', date: 'Date', note: 'Note', expense: 'Expense', profit: 'Profit', cashCustomer: 'Cash Customer', noData: 'No data yet',
    kg: 'kg', g: 'g', piece: 'piece', dozen: 'dozen', bunch: 'bunch', crate: 'crate', vegetables: 'Vegetables', fruits: 'Fruits', leafy: 'Leafy', roots: 'Roots', other: 'Other',
    opening: 'Opening', purchase: 'Purchase', sale: 'Sale', wastageLoss: 'Wastage/Loss', return: 'Return', adjustment: 'Adjustment', stockLedger: 'Stock Ledger', salesReport: 'Sales Report', purchaseReport: 'Purchase Report', profitReport: 'Profit Report', cashbook: 'Cashbook'
  },
  hi: {
    appName: 'सब्जी दुकान मैनेजर', tagline: 'तेज़ बिलिंग, दैनिक मंडी खरीद, स्टॉक, खराबी और उधार मैनेजमेंट', dashboard: 'डैशबोर्ड', billing: 'बिलिंग', inventory: 'सब्जियाँ', purchases: 'मंडी खरीद', wastage: 'खराबी', customers: 'ग्राहक', suppliers: 'सप्लायर', payments: 'भुगतान', reports: 'रिपोर्ट', settings: 'सेटिंग',
    todaySales: 'आज की बिक्री', billsToday: 'आज के बिल', stockValue: 'स्टॉक वैल्यू', customerDue: 'ग्राहक उधार', lowStock: 'कम स्टॉक', freshStock: 'ताज़ा स्टॉक', recentBills: 'हाल के बिल', dailySummary: 'दैनिक सारांश',
    searchVegetable: 'सब्जी खोजें / कोड स्कैन करें', add: 'जोड़ें', save: 'सेव करें', savePrint: 'सेव और प्रिंट', print: 'प्रिंट', edit: 'बदलें', delete: 'हटाएं', cancel: 'रद्द', export: 'Export', import: 'Import', backup: 'Backup', restore: 'Restore', reset: 'Reset',
    name: 'नाम', hindiName: 'हिंदी नाम', category: 'कैटेगरी', unit: 'यूनिट', barcode: 'कोड', purchaseRate: 'खरीद रेट', sellingRate: 'बिक्री रेट', stock: 'स्टॉक', lowStockLevel: 'कम स्टॉक सीमा', wastagePercent: 'खराबी %', qty: 'मात्रा', rate: 'रेट', discount: 'छूट', amount: 'रकम', total: 'कुल', paid: 'प्राप्त', due: 'बाकी', paymentMode: 'भुगतान मोड', customer: 'ग्राहक', phone: 'फोन', address: 'पता', supplier: 'सप्लायर', date: 'तारीख', note: 'नोट', expense: 'खर्च', profit: 'मुनाफा', cashCustomer: 'नकद ग्राहक', noData: 'अभी डेटा नहीं है',
    kg: 'किलो', g: 'ग्राम', piece: 'पीस', dozen: 'दर्जन', bunch: 'गड्डी', crate: 'क्रेट', vegetables: 'सब्जियाँ', fruits: 'फल', leafy: 'हरी सब्जी', roots: 'जड़ वाली', other: 'अन्य',
    opening: 'ओपनिंग', purchase: 'खरीद', sale: 'बिक्री', wastageLoss: 'खराबी/नुकसान', return: 'वापसी', adjustment: 'एडजस्टमेंट', stockLedger: 'स्टॉक लेजर', salesReport: 'बिक्री रिपोर्ट', purchaseReport: 'खरीद रिपोर्ट', profitReport: 'मुनाफा रिपोर्ट', cashbook: 'कैशबुक'
  }
}

export type T = typeof dict.en
export const tFor = (language: Language): T => dict[language]
