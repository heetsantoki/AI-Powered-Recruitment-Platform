const pdfParse = require('pdf-parse');
console.log('pdf-parse type:', typeof pdfParse);

const dummyBuffer = Buffer.from('%PDF-1.4 ...'); // invalid PDF but let\'s see if it runs the function
pdfParse(dummyBuffer)
  .then(data => {
    console.log('Parsed successfully:', data.text);
  })
  .catch(err => {
    console.log('Function invoked successfully (caught parsing error on invalid buffer):', err.message);
  });
