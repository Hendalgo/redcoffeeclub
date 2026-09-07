// All event facts come from ALIANZA RED.pdf. Page numbers are 1-based.
export const event = {
  brand: 'RED Coffee Club', name: 'AeroPress Margarita', region: 'Regional Oriente',
  edition: 'Segunda edición', year: 2025, date: '22 de septiembre',
  dateFull: '22 de septiembre de 2025', venue: 'Rancho Victorio', locality: 'Guarame, Margarita',
  hours: '10:00 a. m. a 6:00 p. m.', capacity: 150, admission: 'Entrada gratuita',
  qualification: 'Los 3 primeros lugares clasifican a la Final Nacional.',
  email: 'redcoffeeclub@gmail.com', document: '/documents/alianza-red.pdf',
  instagram: 'https://www.instagram.com/redcoffeeclub____/', // Profile confirmed by the organizer.
  sources: { edition: 8, year: [5,6,8], practical: 9, contacts: 21 },
  // The source describes 2025, not an announced 2026 event. Never roll dates forward automatically.
  statusNote: 'Información de la edición 2025. Consulta al equipo las próximas convocatorias.',
};
export const contacts = [
  { name: 'Andrés', phone: '584126350980', display: '+58 412 635 0980' },
  { name: 'Yoshio', phone: '584248326285', display: '+58 424 832 6285' },
  { name: 'Hernán', phone: '584248291163', display: '+58 424 829 1163' },
  { name: 'Luis', phone: '34607053830', display: '+34 607 05 38 30' },
];
export const whatsapp = (text: string, phone = contacts[0].phone) => `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
export const team = [
  { name: 'Yoshio Kayo', role: 'Organización · ATRIL Coffee Bar', image: '/images/yoshio.webp', position: '44% 70%', bio: 'Director de ATRIL Coffee Bar y organizador de AeroPress Margarita Regional Oriente 2025. Su trayectoria conecta el café, el servicio y la comunidad.', page: 5 },
  { name: 'Andrés García', role: 'Organización · ATRIL Coffee Bar', image: '/images/andres.webp', position: '64% 42%', bio: 'Licenciado en Tecnología de Alimentos, director de ATRIL Coffee Bar y organizador de AeroPress Margarita Regional Oriente 2025.', page: 6 },
  { name: 'Luis Tovar', role: 'Barista de competencia', image: '/images/luis.webp', position: '79% 22%', bio: 'Campeón de Latte Art EICEV 2022 y subcampeón nacional de barismo 2024. Dos participaciones y dos podios en la Nacional de Barismo.', page: 6 },
  { name: 'Hernán Velásquez', role: 'Filmmaker · Contenido y marca', image: '/images/hernan.webp', position: '50% 18%', bio: 'Filmmaker y editor. Especialista en contenido de eventos, gastronomía y marca personal, con colaboraciones para Adidas, Grupo Robusta y KFC.', page: 5 },
];
export const program = [
  { time: '10:00 a. m.', title: 'Comienza el encuentro', body: 'Inicio del horario general del evento en Rancho Victorio.', page: 9 },
  { time: 'Durante la jornada', title: 'El talento toma la mesa', body: 'Competencia de AeroPress, microactividades y un espacio para compartir con la comunidad del café.', page: 9 },
  { time: '3 lugares', title: 'El camino a la Nacional', body: 'Los tres primeros lugares clasifican a la Final Nacional del Venezuelan AeroPress Championship 2025.', page: 8 },
  { time: '6:00 p. m.', title: 'Cierre de la jornada', body: 'Fin del horario general anunciado. El orden de las rondas y microactividades se consulta con la organización.', page: 9 },
];
export const alliancePlans = [
  { family: 'Legado', name: 'Esencia', contribution: '150 USD', places: '5 cupos en el dossier', description: 'Presencia digital y respaldo de marca.', benefits: ['Integración de marca en el recap oficial.', 'Acceso a activos digitales de alta resolución.', 'Posicionamiento preferencial del logo.'], pages: [12] },
  { family: 'Legado', name: 'Emblema', contribution: '250 USD', places: '4 cupos en el dossier', description: 'Producción audiovisual y activación presencial.', benefits: ['Spot de anuncio de la alianza y cobertura durante el evento.', 'Participación protagónica en el recap.', 'Acceso al banco de imágenes, identidad destacada y zona de activación.'], pages: [13,14] },
  { family: 'Escena', name: 'Impulso', contribution: 'Aporte material', places: 'Modalidad de intercambio', description: 'Recursos que hacen posible la experiencia.', benefits: ['Presencia en historias durante el evento.', 'Inclusión en el recap.', 'Logo en el material P.O.P. oficial.'], pages: [16] },
  { family: 'Escena', name: 'Experiencia', contribution: '50 USD', places: '5 cupos en el dossier', description: 'Conexión directa con la comunidad.', benefits: ['Espacio para la presentación de producto.', 'Inclusión de marca en la camisa oficial.'], note: 'El dossier menciona beneficios del “Aliado Presencia”, un plan que no define. Su alcance debe confirmarse con el equipo.', pages: [17] },
];
export const faqs = [
  { q: '¿Cuándo y dónde es el encuentro?', a: 'El dossier corresponde al 22 de septiembre de 2025, en Rancho Victorio, Guarame, isla de Margarita. El horario anunciado es de 10:00 a. m. a 6:00 p. m. Para una próxima edición, consulta a la organización.', pages: [5,6,8,9] },
  { q: '¿Puedo ir aunque no compita?', a: 'Sí. El evento descrito en el dossier está abierto al público y tiene entrada gratuita. El aforo estimado es de 150 personas.', pages: [9] },
  { q: '¿Quiénes pueden competir?', a: 'La convocatoria a competir es nacional y reúne a baristas y amantes del café. Los requisitos y la disponibilidad de futuras convocatorias deben consultarse directamente con el equipo.', pages: [8,9] },
  { q: '¿Cómo solicito información para participar?', a: 'Pulsa “Quiero participar” para elegir WhatsApp o correo. El dossier no incluye un formulario, una tarifa de competición ni un reglamento de inscripción. El contacto no confirma una plaza.', pages: [9,21] },
  { q: '¿Qué obtienen los primeros lugares?', a: 'Los tres primeros lugares clasifican a la Final Nacional del Venezuelan AeroPress Championship 2025. El documento no especifica premios económicos.', pages: [8,9] },
  { q: '¿Hay otras actividades además de la competencia?', a: 'Sí, el dossier anuncia microactividades alrededor de la competencia. No contiene un cronograma detallado ni horarios de cada ronda.', pages: [9] },
  { q: '¿Cómo puede mi marca convertirse en aliada?', a: 'Existen las modalidades Legado (Esencia y Emblema) y Escena (Impulso y Experiencia). Puedes consultar el dossier y conversar con el equipo para confirmar condiciones, disponibilidad y vigencia de los aportes.', pages: [11,12,13,14,15,16,17,20] },
  { q: '¿Las alianzas incluyen exclusividad?', a: 'Según el dossier, los planes Legado incluyen exclusividad de categoría y prioridad de visibilidad. Los planes Escena no ofrecen exclusividad comercial. El aliado asume la gestión y el traslado de sus aportes materiales.', pages: [18,19] },
];
