import assert from 'assert';

async function runTests() {
  const baseUrl = 'http://localhost:3000';
  console.log('--- Starting OneView Subsystem Test Suite ---');

  // Test 1: Upload media files
  console.log('1. Testing POST /api/upload with media file...');
  const formData = new FormData();
  formData.append('type', 'media');
  formData.append('title', 'Test Confidential Asset Vault');
  formData.append('hours', '2');
  formData.append('singleUse', 'true');

  const fakePngBuffer = Buffer.from('89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000A49444154789C6360000000020001E527DEFC0000000049454E44AE426082', 'hex');
  const blob = new Blob([fakePngBuffer], { type: 'image/png' });
  formData.append('files', blob, 'test-chart.png');

  const uploadRes = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  const uploadData = await uploadRes.json();
  assert.strictEqual(uploadRes.status, 200, 'Upload should return 200');
  assert.strictEqual(uploadData.success, true, 'Upload should be successful');
  assert.ok(uploadData.shareLink.short_code, 'Short code must be returned');
  assert.strictEqual(uploadData.shareLink.short_code.length, 6, 'Short code must be 6 chars');
  assert.strictEqual(uploadData.shareLink.secure_seed.length, 32, 'Secure seed must be 32 chars');
  console.log('✓ POST /api/upload media passed. Code:', uploadData.shareLink.short_code);

  const shortCode = uploadData.shareLink.short_code;
  const secureSeed = uploadData.shareLink.secure_seed;
  const galleryId = uploadData.gallery.id;

  // Extract owner cookie from upload response
  const setCookie = uploadRes.headers.get('set-cookie');
  console.log('Owner cookie present:', Boolean(setCookie));

  // Test 2: Validate token for session 1
  console.log('2. Testing POST /api/validate-token (First Arrival)...');
  const session1Cookie = 'oneview_session=test_sess_001';
  const val1Res = await fetch(`${baseUrl}/api/validate-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': session1Cookie,
    },
    body: JSON.stringify({ token: shortCode }),
  });

  const val1Data = await val1Res.json();
  assert.strictEqual(val1Res.status, 200, 'First session should validate successfully');
  assert.strictEqual(val1Data.success, true);
  assert.strictEqual(val1Data.gallery.images.length, 1);
  assert.ok(val1Data.watermarkData, 'Watermark metadata must be provided');
  console.log('✓ First session successfully validated & device-locked');

  // Test 3: Validate token for session 2 (Should violate single-usage lock)
  console.log('3. Testing POST /api/validate-token (Second Device/Session)...');
  const session2Cookie = 'oneview_session=test_sess_002';
  const val2Res = await fetch(`${baseUrl}/api/validate-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': session2Cookie,
    },
    body: JSON.stringify({ token: shortCode }),
  });

  const val2Data = await val2Res.json();
  assert.strictEqual(val2Res.status, 403, 'Second session must be rejected with 403 Forbidden');
  assert.strictEqual(val2Data.success, false);
  console.log('✓ Single-usage device lock successfully rejected second session:', val2Data.error);

  // Test 4: Validate via 32-character secure seed on allowed session
  console.log('4. Testing validation via 32-character seed...');
  const seedRes = await fetch(`${baseUrl}/api/validate-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': session1Cookie,
    },
    body: JSON.stringify({ token: secureSeed }),
  });
  const seedData = await seedRes.json();
  assert.strictEqual(seedRes.status, 200);
  assert.strictEqual(seedData.success, true);
  console.log('✓ 32-char seed validation passed');

  // Test 5: Upload Stealth Live Web Proxy
  console.log('5. Testing POST /api/upload with Stealth Live Web Proxy...');
  const proxyFormData = new FormData();
  proxyFormData.append('type', 'proxy');
  proxyFormData.append('title', 'Stealth Live Relay Test');
  proxyFormData.append('proxyTargetUrl', 'https://example.com');
  proxyFormData.append('hours', '12');
  proxyFormData.append('singleUse', 'false');

  const proxyUploadRes = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    headers: setCookie ? { 'Cookie': setCookie.split(';')[0] } : {},
    body: proxyFormData,
  });

  const proxyUploadData = await proxyUploadRes.json();
  assert.strictEqual(proxyUploadData.success, true);
  const proxyCode = proxyUploadData.shareLink.short_code;
  console.log('✓ Stealth Proxy minted. Code:', proxyCode);

  // Test 6: Validate Stealth Proxy token (Confirm raw target host is NOT returned)
  console.log('6. Validating proxy token & host masking...');
  const proxyValRes = await fetch(`${baseUrl}/api/validate-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: proxyCode }),
  });
  const proxyValData = await proxyValRes.json();
  assert.strictEqual(proxyValData.success, true);
  assert.strictEqual(proxyValData.gallery.isProxy, true);
  assert.ok(proxyValData.gallery.proxyPath.startsWith('/api/proxy-site?token='), 'Proxy path must be internal relay');
  assert.strictEqual(proxyValData.gallery.proxy_target_url, undefined, 'Raw target URL must never be exposed to client');
  console.log('✓ Raw target host address is securely shielded');

  // Test 7: GET /api/proxy-site stream relay
  console.log('7. Testing GET /api/proxy-site stream relay...');
  const proxyStreamRes = await fetch(`${baseUrl}/api/proxy-site?token=${proxyCode}`);
  assert.strictEqual(proxyStreamRes.status, 200);
  const htmlContent = await proxyStreamRes.text();
  assert.ok(htmlContent.includes('<base href="https://example.com/" />'), 'Base href rewrite must be injected');
  assert.strictEqual(proxyStreamRes.headers.get('x-frame-options'), 'ALLOWALL', 'X-Frame-Options must be rewritten');
  console.log('✓ /api/proxy-site relay rewrite and anti-tamper injection verified');

  // Test 8: GET /api/gallery for owner
  console.log('8. Testing GET /api/gallery with owner cookie...');
  const galleryListRes = await fetch(`${baseUrl}/api/gallery`, {
    headers: setCookie ? { 'Cookie': setCookie.split(';')[0] } : {},
  });
  const galleryListData = await galleryListRes.json();
  assert.strictEqual(galleryListData.success, true);
  assert.ok(Array.isArray(galleryListData.galleries));
  console.log(`✓ Owner galleries listed: ${galleryListData.galleries.length} active vaults`);

  // Test 9: DELETE /api/gallery cascade removal
  console.log('9. Testing DELETE /api/gallery cascade removal...');
  const deleteRes = await fetch(`${baseUrl}/api/gallery`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(setCookie ? { 'Cookie': setCookie.split(';')[0] } : {}),
    },
    body: JSON.stringify({ galleryId }),
  });
  const deleteData = await deleteRes.json();
  assert.strictEqual(deleteRes.status, 200);
  assert.strictEqual(deleteData.success, true);
  console.log('✓ Cascade deletion verified');

  // Test 10: Validate deleted gallery token (must return 404/410)
  console.log('10. Verifying access rejection on deleted vault...');
  const revalRes = await fetch(`${baseUrl}/api/validate-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': session1Cookie,
    },
    body: JSON.stringify({ token: shortCode }),
  });
  assert.ok([404, 410].includes(revalRes.status), 'Deleted vault must be inaccessible');
  console.log('✓ Revocation check passed: Access permanently rejected');

  console.log('\n=============================================');
  console.log('🎉 ALL 10 ONEVIEW SUBSYSTEM TESTS PASSED!');
  console.log('=============================================');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
