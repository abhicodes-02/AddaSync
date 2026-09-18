async function testDeleteBin() {
  const res = await fetch(`https://filebin.net/adda1789761730973`, {
    method: 'DELETE',
    headers: {
      'Origin': 'https://addasync.web.app'
    }
  });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text);
}
testDeleteBin();
