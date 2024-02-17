const { sqlForPartialUpdate } = require('./sql'); // Import the function to be tested
const { BadRequestError } = require('../expressError'); // Import the error class if used


describe('sqlForPartialUpdate', () => {
  // Test case 1: Valid data
  test('should generate SQL update statement for valid data', () => {
    const dataToUpdate = { firstName: 'Aliya', age: 32 };
    const jsToSql = { firstName: 'first_name' }; // Example mapping
    const expectedResult = {
      setCols: '"first_name"=$1, "age"=$2',
      values: ['Aliya', 32],
    };
    expect(sqlForPartialUpdate(dataToUpdate, jsToSql)).toEqual(expectedResult);
  });

  // Test case 2: No data provided
  test('should throw BadRequestError for no data', () => {
    const dataToUpdate = {};
    const jsToSql = {};
    expect(() => {
      sqlForPartialUpdate(dataToUpdate, jsToSql);
    }).toThrow(BadRequestError); // Adjust based on your error handling
  })});
