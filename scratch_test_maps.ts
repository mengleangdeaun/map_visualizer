import { parseGoogleMapsUrl } from './resources/js/src/lib/maps';

const testUrls = [
    'https://www.google.com/maps/place/Phnom+Penh/@11.5310592,104.8674304,15z/data=!4m6!3m5!1s0x3109513dc76a6be3:0x9c010ee85a525bb7!8m2!3d11.5563738!4d104.9282099!16zL20vMGRycno?entry=ttu',
    'https://www.google.com/maps/@11.5310592,104.8674304,15z?entry=ttu',
    'https://www.google.com/maps/search/11.5310592,104.8674304?entry=ttu',
    'https://maps.app.goo.gl/abcdefg', // Short URL - might not work without fetching
];

testUrls.forEach(url => {
    console.log(`URL: ${url}`);
    console.log('Result:', parseGoogleMapsUrl(url));
    console.log('---');
});
