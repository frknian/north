// Mechanical format/size conversion of the existing North brand asset.
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
const source='public/north-mark.png';
for(const size of [180,192,512]) {
  await sharp(source).resize(size,size).flatten({background:'#191a1d'}).png().toFile(`public/north-${size}.png`);
}
await sharp(source).resize(400,400).extend({top:56,bottom:56,left:56,right:56,background:'#191a1d'}).flatten({background:'#191a1d'}).png().toFile('public/north-maskable-512.png');
const sizes=[16,32,48,64];const images=await Promise.all(sizes.map(size=>sharp(source).resize(size,size).png().toBuffer()));
const header=Buffer.alloc(6+16*sizes.length);header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);
let offset=header.length;
images.forEach((buffer,i)=>{const at=6+i*16;header[at]=sizes[i];header[at+1]=sizes[i];header.writeUInt16LE(1,at+4);header.writeUInt16LE(32,at+6);header.writeUInt32LE(buffer.length,at+8);header.writeUInt32LE(offset,at+12);offset+=buffer.length;});
await writeFile('src/app/favicon.ico',Buffer.concat([header,...images]));
const png=await sharp(source).resize(128,128).png().toBuffer();
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="24" fill="#191a1d"/><image width="128" height="128" href="data:image/png;base64,${png.toString('base64')}"/></svg>`;
await writeFile('public/icon.svg',svg);
await writeFile('public/favicon.svg',svg);
console.log('North icons generated: ICO 16/32/48/64, SVG, PNG 180/192/512, maskable 512.');
