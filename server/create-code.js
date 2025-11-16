/**
 * Script đơn giản để tạo credit codes
 * 
 * Cách sử dụng:
 * node create-code.js <số_credits> [code_tùy_chỉnh]
 * 
 * Ví dụ:
 * node create-code.js 25
 * node create-code.js 50 WELCOME50
 */

import fetch from 'node-fetch';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const credits = process.argv[2];
const customCode = process.argv[3];

if (!credits) {
  console.error('❌ Vui lòng nhập số credits!');
  console.log('\nCách sử dụng:');
  console.log('  node create-code.js <số_credits> [code_tùy_chỉnh]');
  console.log('\nVí dụ:');
  console.log('  node create-code.js 25');
  console.log('  node create-code.js 50 WELCOME50');
  process.exit(1);
}

const creditsNum = parseInt(credits, 10);
if (isNaN(creditsNum) || creditsNum <= 0) {
  console.error('❌ Số credits phải là số nguyên dương!');
  process.exit(1);
}

async function createCode() {
  try {
    const body = { credits: creditsNum };
    if (customCode) {
      body.code = customCode.toUpperCase();
    }

    console.log(`\n🔄 Đang tạo code...`);
    console.log(`   Credits: ${creditsNum}`);
    if (customCode) {
      console.log(`   Code tùy chỉnh: ${customCode.toUpperCase()}`);
    }

    const response = await fetch(`${SERVER_URL}/api/admin/generate-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create code');
    }

    const result = await response.json();

    console.log('\n✅ Code đã được tạo thành công!');
    console.log('\n📋 Thông tin code:');
    console.log(`   Code: ${result.code}`);
    console.log(`   Credits: ${result.credits}`);
    console.log('\n💡 Người dùng có thể nhập code này trong ứng dụng để nhận credits.');
    console.log(`\n📝 Lưu code này lại: ${result.code}`);
    
  } catch (error) {
    console.error('\n❌ Lỗi khi tạo code:');
    console.error(`   ${error.message}`);
    
    if (error.message.includes('fetch')) {
      console.error('\n💡 Đảm bảo server đang chạy tại:', SERVER_URL);
      console.error('   Chạy: cd server && npm start');
    }
    
    process.exit(1);
  }
}

createCode();

