// Test validation functions
const { isValidEmail, isValidPhone } = require('./dist/utils/validation');

console.log('🧪 Testing validation functions...');

// Test email validation
const email = "cabdirxmn1100@gmail.com";
console.log(`📧 Email "${email}" is valid:`, isValidEmail(email));

// Test phone validation
const phone = "616520449";
console.log(`📱 Phone "${phone}" is valid:`, isValidPhone(phone));

// Test phone validation with different formats
const phoneVariations = [
  "616520449",
  "+616520449", 
  " 616520449 ",
  "0616520449",
  "616-520-449"
];

phoneVariations.forEach(phone => {
  console.log(`📱 Phone "${phone}" is valid:`, isValidPhone(phone));
});
