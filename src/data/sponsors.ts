import inventory from '../../docs/source-assets/sponsors-drive.json';

type Sponsor = { name: string; account?: string; href?: string; download?: boolean; src: string; width: number; height: number; source: string };
function original(index: number, name: string, account?: string): Sponsor {
 const file=inventory.files.find(file => file.index === index)!;
 const [x,y,w,h]=file.bounds, pad=Math.ceil(Math.max(w,h)*.025);
 const width=Math.min(file.width,x+w+pad)-Math.max(0,x-pad);
 const height=Math.min(file.height,y+h+pad)-Math.max(0,y-pad);
 return {name,account,src:'/optimized/sponsor-'+index+'.webp',width,height,source:'drive'};
}

export const sponsors: Sponsor[] = [
  original(5, 'ATRIL Coffee Bar', 'atrilcoffeebar'),
  original(12, 'Farah', 'djfarah.music'),
  original(14, 'Juana la Loca', 'juanalalocarest'),
  original(10, 'Hacienda 4D', 'hacienda4dcafe'),
  original(20, 'Isabel La Católica', 'hotelisabellacatolica'),
  original(17, 'Laura Sofía Marcano', 'laurasofiamarcano'),
  original(6, 'Barista Academy', 'baristaacademy_vzla'),
  { name: 'Kofy', account: 'kofy.io', src: '/optimized/sponsor-kofy.webp', width: 91, height: 94, source: 'poster' },
  original(11, 'Hercris Pérez', 'hercrisperez'),
  original(19, 'Apetoy', 'apetoyvenezuela'),
  original(26, 'Venezuelan AeroPress Championship'),
  original(13, 'Essenza Café'),
  original(4, 'Aillio'),
  original(15, 'Locos de Viaje'),
  original(21, 'Mediterráneo · Tostadores de café'),
  { name: 'Marca aliada del cartel · sello junto a Mediterráneo', src: '/optimized/sponsor-seal.webp', width: 68, height: 72, source: 'poster' },
  original(7, 'Café Amanecer'),
  original(24, 'Phiola'),
  original(23, 'Marca aliada del cartel · cafetera 32'),
  original(9, 'Giorgio'),
  original(16, 'La Marzocco'),
  original(2, 'H77', 'h77.ca'),
  original(18, 'Rancho Victorio', 'rancho_victorio'),
  original(1, 'Dos Mile', 'dos.mile'),
  original(22, 'Minalba'),
  original(8, 'Minalba Sparkling'),
  { name: 'Hidra', href: 'https://hidra.zip', src: '/optimized/hidra-logo-400.webp', width: 1080, height: 300, source: 'local' },
];

// Aillio's alternate symbol and RED's organizer logo are not extra sponsors.
// Keep the remaining supplied profile that has no individual logo in the folder.
export const communityAllies = ['proyectoarsh'];
