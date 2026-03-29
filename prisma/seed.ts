import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Era, OperationType, Outcome, OperationStatus, SourceType } from "../src/generated/prisma";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

interface SeedOperation {
  slug: string;
  slugEs: string;
  title: string;
  titleEs: string;
  aliases: string[];
  icebergLevel: number;
  era: Era;
  types: OperationType[];
  actors: string[];
  targets: string[];
  outcome: Outcome;
  status: OperationStatus;
  bodyEn: string;
  bodyEs: string;
  excerpt: string;
  excerptEs: string;
  sources: { url: string | null; title: string; type: SourceType; credibility: number }[];
  tags: { slug: string; name: string; nameEs: string }[];
}

const operations: SeedOperation[] = [
  // ─── Level 1: Well-Known & Declassified (5 ops) ───
  {
    slug: "cointelpro",
    slugEs: "cointelpro",
    title: "COINTELPRO",
    titleEs: "COINTELPRO",
    aliases: ["Counter Intelligence Program"],
    icebergLevel: 1,
    era: Era.COLD_WAR,
    types: [OperationType.INFILTRATION, OperationType.SURVEILLANCE],
    actors: ["United States", "FBI"],
    targets: ["Civil rights groups", "Political activists", "Black Panther Party"],
    outcome: Outcome.SUCCESSFUL,
    status: OperationStatus.DECLASSIFIED,
    bodyEn: "## Overview\n\nCOINTELPRO (Counter Intelligence Program) was a series of covert and illegal projects conducted by the FBI aimed at surveilling, infiltrating, discrediting, and disrupting domestic American political organizations.\n\n## Background\n\nThe program ran from 1956 to 1971 and targeted groups the FBI deemed \"subversive,\" including civil rights leaders like Martin Luther King Jr., the Black Panther Party, the American Indian Movement, and anti-war protesters.\n\n## Methods\n\n- Infiltration of organizations with informants\n- Psychological warfare through planted media stories\n- Harassment through the legal system (false arrests, tax audits)\n- Extralegal force including intimidation and violence\n- \"Black propaganda\" — forged correspondence to create internal disputes\n\n## Exposure\n\nCOINTELPRO was exposed in 1971 when the Citizens' Commission to Investigate the FBI burglarized an FBI office in Media, Pennsylvania, and leaked documents to the press.\n\n## Legacy\n\nThe Church Committee hearings of 1975-1976 confirmed the program's existence and led to reforms in FBI oversight.",
    bodyEs: "## Resumen\n\nCOINTELPRO (Programa de Contrainteligencia) fue una serie de proyectos encubiertos e ilegales realizados por el FBI dirigidos a vigilar, infiltrar, desacreditar e interrumpir organizaciones politicas nacionales estadounidenses.\n\n## Antecedentes\n\nEl programa funcionó de 1956 a 1971 y se dirigió a grupos que el FBI consideraba \"subversivos.\"\n\n## Metodos\n\n- Infiltración de organizaciones con informantes\n- Guerra psicológica a traves de historias plantadas en los medios\n- Acoso a traves del sistema legal\n- Fuerza extralegal incluyendo intimidación y violencia\n\n## Exposición\n\nCOINTELPRO fue expuesto en 1971 cuando la Comisión Ciudadana para Investigar al FBI robó una oficina del FBI en Media, Pensilvania.",
    excerpt: "FBI's covert program to surveil, infiltrate, and disrupt domestic political organizations from 1956 to 1971.",
    excerptEs: "Programa encubierto del FBI para vigilar, infiltrar e interrumpir organizaciones politicas nacionales de 1956 a 1971.",
    sources: [
      { url: "https://vault.fbi.gov/cointel-pro", title: "FBI Vault: COINTELPRO", type: SourceType.GOVERNMENT, credibility: 5 },
      { url: null, title: "The COINTELPRO Papers by Ward Churchill", type: SourceType.BOOK, credibility: 4 },
    ],
    tags: [
      { slug: "fbi", name: "FBI", nameEs: "FBI" },
      { slug: "civil-rights", name: "Civil Rights", nameEs: "Derechos Civiles" },
    ],
  },
  {
    slug: "mkultra",
    slugEs: "mkultra",
    title: "MKUltra",
    titleEs: "MKUltra",
    aliases: ["MK-Ultra", "Project MKUltra"],
    icebergLevel: 1,
    era: Era.COLD_WAR,
    types: [OperationType.MIND_CONTROL],
    actors: ["United States", "CIA"],
    targets: ["Civilians", "Military personnel", "Prisoners"],
    outcome: Outcome.PARTIAL,
    status: OperationStatus.DECLASSIFIED,
    bodyEn: "## Overview\n\nProject MKUltra was a top-secret CIA program that conducted illegal experiments on human subjects to develop mind control techniques using drugs, hypnosis, sensory deprivation, and psychological torture.\n\n## Background\n\nInitiated in 1953 during the Cold War, MKUltra was motivated by fears that the Soviet Union, China, and North Korea were using mind control on U.S. prisoners of war.\n\n## Methods\n\n- Administration of LSD and other psychoactive drugs to unwitting subjects\n- Hypnosis and sensory deprivation experiments\n- Electroshock therapy at extreme levels\n- Over 150 sub-projects at 80+ institutions\n\n## Exposure\n\nCIA Director Richard Helms ordered all MKUltra files destroyed in 1973. A cache of 20,000 documents survived due to a filing error and was discovered in 1977 via FOIA request.",
    bodyEs: "## Resumen\n\nEl Proyecto MKUltra fue un programa ultrasecreto de la CIA que realizó experimentos ilegales en sujetos humanos para desarrollar tecnicas de control mental.\n\n## Antecedentes\n\nIniciado en 1953 durante la Guerra Fría, MKUltra fue motivado por temores de que la Unión Sovietica estaba usando control mental en prisioneros de guerra.\n\n## Metodos\n\n- Administración de LSD y otras drogas psicoactivas a sujetos sin su conocimiento\n- Experimentos de hipnosis y privación sensorial\n- Terapia de electroshock a niveles extremos\n\n## Exposición\n\nUn archivo de 20,000 documentos sobrevivió debido a un error de archivo y fue descubierto en 1977.",
    excerpt: "CIA's illegal mind control program using LSD, hypnosis, and psychological torture on unwitting human subjects.",
    excerptEs: "Programa ilegal de control mental de la CIA usando LSD, hipnosis y tortura psicológica en sujetos humanos.",
    sources: [
      { url: "https://www.cia.gov/readingroom/collection/mkultra", title: "CIA FOIA Reading Room: MKUltra", type: SourceType.GOVERNMENT, credibility: 5 },
      { url: null, title: "The Search for the Manchurian Candidate by John Marks", type: SourceType.BOOK, credibility: 4 },
    ],
    tags: [
      { slug: "cia", name: "CIA", nameEs: "CIA" },
      { slug: "mind-control", name: "Mind Control", nameEs: "Control Mental" },
    ],
  },
  {
    slug: "operation-paperclip",
    slugEs: "operacion-paperclip",
    title: "Operation Paperclip",
    titleEs: "Operacion Paperclip",
    aliases: ["Project Paperclip"],
    icebergLevel: 1,
    era: Era.WWII,
    types: [OperationType.INFILTRATION],
    actors: ["United States", "OSS", "JIOA"],
    targets: ["German scientists", "Military technology"],
    outcome: Outcome.SUCCESSFUL,
    status: OperationStatus.DECLASSIFIED,
    bodyEn: "## Overview\n\nOperation Paperclip was a secret United States intelligence program in which more than 1,600 German scientists, engineers, and technicians were recruited from post-Nazi Germany.\n\n## Methods\n\n- Whitewashing Nazi records to bypass President Truman's anti-Nazi directive\n- Providing new identities and immigration paperwork\n- Placing scientists in key positions at NASA, Fort Bliss, and other installations\n\n## Key Figures\n\n- Wernher von Braun — former SS officer, became director of NASA's Marshall Space Flight Center\n- Kurt Blome — Nazi biological weapons scientist\n\n## Legacy\n\nOperation Paperclip fundamentally shaped U.S. space and military technology programs.",
    bodyEs: "## Resumen\n\nLa Operación Paperclip fue un programa secreto de inteligencia de Estados Unidos en el que más de 1,600 científicos alemanes fueron reclutados de la Alemania post-nazi.\n\n## Metodos\n\n- Blanqueo de registros nazis\n- Proporcionar nuevas identidades y documentación migratoria\n- Colocación de científicos en posiciones clave en la NASA\n\n## Legado\n\nLa Operación Paperclip dio forma fundamental a los programas de tecnología espacial y militar de EE.UU.",
    excerpt: "Secret U.S. program that recruited 1,600+ German scientists from post-Nazi Germany, whitewashing their war records.",
    excerptEs: "Programa secreto de EE.UU. que reclutó a más de 1,600 científicos alemanes de la Alemania post-nazi.",
    sources: [
      { url: null, title: "National Archives: Operation Paperclip Records", type: SourceType.GOVERNMENT, credibility: 5 },
      { url: null, title: "Operation Paperclip by Annie Jacobsen", type: SourceType.BOOK, credibility: 4 },
    ],
    tags: [
      { slug: "nasa", name: "NASA", nameEs: "NASA" },
      { slug: "wwii", name: "World War II", nameEs: "Segunda Guerra Mundial" },
    ],
  },
  {
    slug: "operation-northwoods",
    slugEs: "operacion-northwoods",
    title: "Operation Northwoods",
    titleEs: "Operacion Northwoods",
    aliases: [],
    icebergLevel: 1,
    era: Era.COLD_WAR,
    types: [OperationType.FALSE_FLAG, OperationType.DECEPTION],
    actors: ["United States", "Joint Chiefs of Staff"],
    targets: ["American public", "Cuba"],
    outcome: Outcome.FAILED,
    status: OperationStatus.DECLASSIFIED,
    bodyEn: "## Overview\n\nOperation Northwoods was a proposed false flag operation against American citizens that originated within the U.S. Department of Defense in 1962.\n\n## Proposals\n\n- Staging mock attacks on U.S. military bases\n- Sinking a U.S. Navy ship in Guantanamo Bay\n- Hijacking planes and blaming Cuba\n- Bombing Miami and Washington, D.C.\n\n## Rejection\n\nPresident John F. Kennedy rejected the proposal and removed Chairman Lyman Lemnitzer.\n\n## Declassification\n\nThe documents were declassified in 1997 as part of the JFK Assassination Records Review Board process.",
    bodyEs: "## Resumen\n\nLa Operación Northwoods fue una operación de falsa bandera propuesta contra ciudadanos estadounidenses que se originó dentro del Departamento de Defensa en 1962.\n\n## Propuestas\n\n- Escenificar ataques simulados a bases militares\n- Hundir un barco de la Marina en Guantánamo\n- Secuestrar aviones y culpar a Cuba\n\n## Rechazo\n\nEl presidente Kennedy rechazó la propuesta.\n\n## Desclasificación\n\nLos documentos fueron desclasificados en 1997.",
    excerpt: "Proposed 1962 false flag operation by the Joint Chiefs of Staff to stage terrorist attacks on U.S. soil and blame Cuba.",
    excerptEs: "Operación de falsa bandera propuesta en 1962 para escenificar ataques terroristas en suelo estadounidense y culpar a Cuba.",
    sources: [
      { url: null, title: "National Security Archive: Northwoods Document", type: SourceType.GOVERNMENT, credibility: 5 },
      { url: null, title: "Body of Secrets by James Bamford", type: SourceType.BOOK, credibility: 4 },
    ],
    tags: [
      { slug: "false-flag", name: "False Flag", nameEs: "Falsa Bandera" },
      { slug: "cuba", name: "Cuba", nameEs: "Cuba" },
    ],
  },
  {
    slug: "operation-mockingbird",
    slugEs: "operacion-sinsonte",
    title: "Operation Mockingbird",
    titleEs: "Operacion Sinsonte",
    aliases: [],
    icebergLevel: 1,
    era: Era.COLD_WAR,
    types: [OperationType.PROPAGANDA, OperationType.INFLUENCE_OP],
    actors: ["United States", "CIA"],
    targets: ["American media", "Public opinion"],
    outcome: Outcome.SUCCESSFUL,
    status: OperationStatus.DECLASSIFIED,
    bodyEn: "## Overview\n\nOperation Mockingbird was an alleged large-scale CIA campaign to infiltrate and influence American media organizations during the Cold War.\n\n## Methods\n\n- Direct recruitment of journalists as CIA assets\n- Funding of student and cultural organizations as front groups\n- Placement of stories in major publications\n\n## Key Details\n\nAt its peak, the operation allegedly included over 400 journalists and 25 major organizations.\n\n## Exposure\n\nDetails emerged through the Church Committee investigations in 1975.",
    bodyEs: "## Resumen\n\nLa Operación Sinsonte fue una presunta campaña a gran escala de la CIA para infiltrar e influir en los medios estadounidenses.\n\n## Metodos\n\n- Reclutamiento directo de periodistas como activos de la CIA\n- Financiamiento de organizaciones como grupos fachada\n\n## Exposición\n\nLos detalles surgieron a traves de las investigaciones del Comite Church en 1975.",
    excerpt: "CIA campaign to infiltrate American media, recruiting 400+ journalists and 25 organizations as propaganda assets.",
    excerptEs: "Campaña de la CIA para infiltrar los medios estadounidenses, reclutando a más de 400 periodistas.",
    sources: [
      { url: null, title: "The Mighty Wurlitzer by Hugh Wilford", type: SourceType.BOOK, credibility: 4 },
      { url: null, title: "Church Committee Final Report, Book II", type: SourceType.GOVERNMENT, credibility: 5 },
    ],
    tags: [
      { slug: "cia", name: "CIA", nameEs: "CIA" },
      { slug: "media-manipulation", name: "Media Manipulation", nameEs: "Manipulación de Medios" },
    ],
  },

  // ─── Level 2: Known but Underappreciated (5 ops) ──
  {
    slug: "operation-gladio",
    slugEs: "operacion-gladio",
    title: "Operation Gladio",
    titleEs: "Operacion Gladio",
    aliases: ["Stay-Behind Networks"],
    icebergLevel: 2,
    era: Era.COLD_WAR,
    types: [OperationType.FALSE_FLAG, OperationType.INFILTRATION],
    actors: ["NATO", "CIA", "MI6", "Italy"],
    targets: ["European civilians", "Left-wing parties"],
    outcome: Outcome.SUCCESSFUL,
    status: OperationStatus.DECLASSIFIED,
    bodyEn: "## Overview\n\nOperation Gladio was a clandestine NATO \"stay-behind\" operation during the Cold War. Secret armies were established across Western Europe.\n\n## Revelations\n\nItalian Prime Minister Giulio Andreotti confirmed Gladio's existence in 1990. Links were discovered to the 1980 Bologna railway station bombing that killed 85 people.\n\n## Legacy\n\nThe European Parliament condemned the existence of these networks in 1990.",
    bodyEs: "## Resumen\n\nLa Operación Gladio fue una operación clandestina de la OTAN de redes de retaguardia durante la Guerra Fría.\n\n## Revelaciones\n\nEl primer ministro italiano Giulio Andreotti confirmó la existencia de Gladio en 1990.\n\n## Legado\n\nEl Parlamento Europeo condenó la existencia de estas redes en 1990.",
    excerpt: "NATO's clandestine stay-behind armies across Western Europe, linked to false-flag terrorism and political manipulation.",
    excerptEs: "Ejércitos clandestinos de retaguardia de la OTAN en Europa Occidental, vinculados al terrorismo de falsa bandera.",
    sources: [
      { url: null, title: "NATO's Secret Armies by Daniele Ganser", type: SourceType.BOOK, credibility: 4 },
      { url: null, title: "European Parliament Resolution on Gladio, Nov 22, 1990", type: SourceType.GOVERNMENT, credibility: 5 },
    ],
    tags: [
      { slug: "nato", name: "NATO", nameEs: "OTAN" },
      { slug: "false-flag", name: "False Flag", nameEs: "Falsa Bandera" },
    ],
  },
  {
    slug: "gulf-of-tonkin",
    slugEs: "golfo-de-tonkin",
    title: "Gulf of Tonkin Incident",
    titleEs: "Incidente del Golfo de Tonkin",
    aliases: ["Tonkin Gulf Incident"],
    icebergLevel: 2,
    era: Era.COLD_WAR,
    types: [OperationType.FALSE_FLAG, OperationType.DECEPTION],
    actors: ["United States", "NSA", "U.S. Navy"],
    targets: ["American public", "U.S. Congress"],
    outcome: Outcome.SUCCESSFUL,
    status: OperationStatus.DECLASSIFIED,
    bodyEn: "## Overview\n\nThe Gulf of Tonkin incident refers to two reported confrontations in August 1964. The second attack — used to justify escalating Vietnam — almost certainly did not occur.\n\n## The Deception\n\nNSA documents declassified in 2005 confirmed the second attack never happened. Intelligence was deliberately manipulated.\n\n## Consequences\n\nThe Gulf of Tonkin Resolution gave President Johnson broad authority to escalate the Vietnam War.",
    bodyEs: "## Resumen\n\nEl incidente del Golfo de Tonkin se refiere a dos confrontaciones reportadas en agosto de 1964. El segundo ataque — usado para justificar escalar Vietnam — casi con certeza no ocurrió.\n\n## El Engaño\n\nDocumentos de la NSA desclasificados en 2005 confirmaron que el segundo ataque nunca ocurrió.\n\n## Consecuencias\n\nLa Resolución del Golfo de Tonkin dio al presidente Johnson amplia autoridad para escalar la Guerra de Vietnam.",
    excerpt: "Fabricated 1964 naval confrontation used to justify U.S. escalation of the Vietnam War.",
    excerptEs: "Confrontación naval fabricada en 1964 usada para justificar la escalada de EE.UU. en Vietnam.",
    sources: [
      { url: null, title: "NSA Declassified Gulf of Tonkin Documents", type: SourceType.GOVERNMENT, credibility: 5 },
      { url: null, title: "The Fog of War (documentary, 2003)", type: SourceType.VIDEO, credibility: 4 },
    ],
    tags: [
      { slug: "vietnam", name: "Vietnam War", nameEs: "Guerra de Vietnam" },
      { slug: "nsa", name: "NSA", nameEs: "NSA" },
    ],
  },
  {
    slug: "operation-condor",
    slugEs: "operacion-condor",
    title: "Operation Condor",
    titleEs: "Operacion Condor",
    aliases: ["Plan Condor"],
    icebergLevel: 2,
    era: Era.COLD_WAR,
    types: [OperationType.ASSASSINATION, OperationType.INFILTRATION, OperationType.SURVEILLANCE],
    actors: ["United States", "CIA", "Argentina", "Chile", "Brazil", "Paraguay", "Uruguay", "Bolivia"],
    targets: ["Left-wing dissidents", "Civilians"],
    outcome: Outcome.SUCCESSFUL,
    status: OperationStatus.DECLASSIFIED,
    bodyEn: "## Overview\n\nOperation Condor was a campaign of political repression involving intelligence operations and assassination, jointly implemented by South American dictatorships with U.S. support.\n\n## Scope\n\nAn estimated 60,000 people were killed and 400,000 were imprisoned.\n\n## U.S. Involvement\n\nDeclassified documents confirmed active U.S. support. Secretary of State Kissinger was directly informed.",
    bodyEs: "## Resumen\n\nLa Operación Cóndor fue una campaña de represión política que involucró operaciones de inteligencia y asesinato, implementada por dictaduras sudamericanas con apoyo de EE.UU.\n\n## Alcance\n\nSe estima que 60,000 personas fueron asesinadas y 400,000 encarceladas.",
    excerpt: "U.S.-backed campaign of political repression across South American dictatorships — 60,000 killed, 400,000 imprisoned.",
    excerptEs: "Campaña de represión política respaldada por EE.UU. en dictaduras sudamericanas — 60,000 muertos, 400,000 encarcelados.",
    sources: [
      { url: null, title: "National Security Archive: Argentina Declassification", type: SourceType.GOVERNMENT, credibility: 5 },
      { url: null, title: "Predatory States by J. Patrice McSherry", type: SourceType.ACADEMIC, credibility: 4 },
    ],
    tags: [
      { slug: "cia", name: "CIA", nameEs: "CIA" },
      { slug: "latin-america", name: "Latin America", nameEs: "America Latina" },
    ],
  },
  {
    slug: "project-artichoke",
    slugEs: "proyecto-alcachofa",
    title: "Project Artichoke",
    titleEs: "Proyecto Alcachofa",
    aliases: ["Project Bluebird"],
    icebergLevel: 2,
    era: Era.COLD_WAR,
    types: [OperationType.MIND_CONTROL],
    actors: ["United States", "CIA"],
    targets: ["Prisoners of war", "Defectors"],
    outcome: Outcome.PARTIAL,
    status: OperationStatus.DECLASSIFIED,
    bodyEn: "## Overview\n\nProject Artichoke was a CIA program that researched interrogation methods using drugs, hypnosis, and forced morphine addiction/withdrawal.\n\n## Background\n\nRunning from 1951 to 1953, Artichoke was the direct predecessor to MKUltra.\n\n## Legacy\n\nProject Artichoke laid the groundwork for MKUltra.",
    bodyEs: "## Resumen\n\nEl Proyecto Alcachofa fue un programa de la CIA que investigó metodos de interrogatorio usando drogas, hipnosis y adicción forzada de morfina.\n\n## Antecedentes\n\nFuncionando de 1951 a 1953, fue el predecesor directo de MKUltra.",
    excerpt: "CIA precursor to MKUltra using drugs, hypnosis, and forced addiction to develop interrogation techniques.",
    excerptEs: "Precursor de la CIA a MKUltra usando drogas, hipnosis y adicción forzada.",
    sources: [
      { url: null, title: "CIA Reading Room: Project Artichoke", type: SourceType.GOVERNMENT, credibility: 5 },
      { url: null, title: "A Terrible Mistake by H.P. Albarelli Jr.", type: SourceType.BOOK, credibility: 3 },
    ],
    tags: [
      { slug: "cia", name: "CIA", nameEs: "CIA" },
      { slug: "mind-control", name: "Mind Control", nameEs: "Control Mental" },
    ],
  },
  {
    slug: "jade-helm-15",
    slugEs: "jade-helm-15",
    title: "Jade Helm 15",
    titleEs: "Jade Helm 15",
    aliases: [],
    icebergLevel: 2,
    era: Era.MODERN,
    types: [OperationType.PROPAGANDA, OperationType.DISINFORMATION],
    actors: ["United States", "U.S. Special Operations Command"],
    targets: ["American public"],
    outcome: Outcome.PARTIAL,
    status: OperationStatus.DECLASSIFIED,
    bodyEn: "## Overview\n\nJade Helm 15 was a U.S. military training exercise in 2015 that became the subject of conspiracy theories about martial law.\n\n## The Psyop Angle\n\nRussian-linked social media accounts amplified conspiracy theories about the exercise, making it an early case study in foreign information warfare.\n\n## Legacy\n\nA 2017 study found Russian troll accounts specifically targeted Jade Helm to test techniques later used in the 2016 election.",
    bodyEs: "## Resumen\n\nJade Helm 15 fue un ejercicio de entrenamiento militar en 2015 que se convirtió en objeto de teorías conspirativas.\n\n## El Ángulo Psyop\n\nCuentas de redes sociales vinculadas a Rusia amplificaron las teorías conspirativas.\n\n## Legado\n\nUn estudio de 2017 encontró que cuentas de trolls rusos atacaron específicamente a Jade Helm.",
    excerpt: "2015 U.S. military exercise that became a case study in Russian information warfare amplifying conspiracy theories.",
    excerptEs: "Ejercicio militar de EE.UU. en 2015 que se convirtió en caso de estudio en guerra informativa rusa.",
    sources: [
      { url: null, title: "Information Warfare and Jade Helm 15 (Journal of Strategic Studies)", type: SourceType.ACADEMIC, credibility: 4 },
      { url: null, title: "Computational Propaganda (Oxford)", type: SourceType.ACADEMIC, credibility: 4 },
    ],
    tags: [
      { slug: "russia", name: "Russia", nameEs: "Rusia" },
      { slug: "disinformation", name: "Disinformation", nameEs: "Desinformación" },
    ],
  },

  // ─── Level 3: Leaked / Partially Verified (5 ops) ─
  {
    slug: "cambridge-analytica",
    slugEs: "cambridge-analytica",
    title: "Cambridge Analytica / Facebook",
    titleEs: "Cambridge Analytica / Facebook",
    aliases: ["Facebook Data Scandal"],
    icebergLevel: 3,
    era: Era.DIGITAL_AGE,
    types: [OperationType.INFLUENCE_OP, OperationType.SURVEILLANCE],
    actors: ["United Kingdom", "Cambridge Analytica", "SCL Group", "Facebook"],
    targets: ["Voters", "Social media users"],
    outcome: Outcome.SUCCESSFUL,
    status: OperationStatus.LEAKED,
    bodyEn: "## Overview\n\nCambridge Analytica harvested personal data from 87 million Facebook users without consent to build psychological profiles and target them with political ads.\n\n## Methods\n\n- Harvested data via a personality quiz app\n- Built psychographic profiles based on OCEAN model\n- Used techniques derived from military psychological operations\n\n## Exposure\n\nWhistleblower Christopher Wylie revealed the operation in March 2018.\n\n## Consequences\n\nCambridge Analytica shut down in May 2018. Facebook was fined $5 billion by the FTC.",
    bodyEs: "## Resumen\n\nCambridge Analytica recopiló datos personales de 87 millones de usuarios de Facebook sin consentimiento para publicidad política.\n\n## Metodos\n\n- Recopiló datos via cuestionario de personalidad\n- Construyó perfiles psicográficos\n\n## Exposición\n\nEl denunciante Christopher Wylie reveló la operación en marzo de 2018.\n\n## Consecuencias\n\nFacebook fue multado con $5 mil millones por la FTC.",
    excerpt: "British firm that harvested 87 million Facebook profiles to build psychographic voter profiles using military psyop techniques.",
    excerptEs: "Firma británica que recopiló 87 millones de perfiles de Facebook para perfiles psicográficos de votantes.",
    sources: [
      { url: null, title: "The Great Hack (Netflix, 2019)", type: SourceType.VIDEO, credibility: 4 },
      { url: null, title: "Mindf*ck by Christopher Wylie", type: SourceType.BOOK, credibility: 5 },
    ],
    tags: [
      { slug: "social-media", name: "Social Media", nameEs: "Redes Sociales" },
      { slug: "elections", name: "Elections", nameEs: "Elecciones" },
    ],
  },
  {
    slug: "internet-research-agency",
    slugEs: "agencia-de-investigacion-de-internet",
    title: "Internet Research Agency",
    titleEs: "Agencia de Investigacion de Internet",
    aliases: ["IRA", "Troll Farm"],
    icebergLevel: 3,
    era: Era.DIGITAL_AGE,
    types: [OperationType.DISINFORMATION, OperationType.INFLUENCE_OP, OperationType.PROPAGANDA],
    actors: ["Russia", "Internet Research Agency"],
    targets: ["American voters", "Social media users"],
    outcome: Outcome.SUCCESSFUL,
    status: OperationStatus.LEAKED,
    bodyEn: "## Overview\n\nThe Internet Research Agency is a Russian company engaged in online influence operations. Based in St. Petersburg, it employed hundreds to create fake social media accounts.\n\n## Scale\n\nBudget was approximately $1.25 million per month by September 2016. Reached an estimated 126 million Americans on Facebook alone.\n\n## Consequences\n\nThe U.S. DOJ indicted 13 Russian nationals and 3 organizations in 2018.",
    bodyEs: "## Resumen\n\nLa Agencia de Investigación de Internet es una empresa rusa dedicada a operaciones de influencia en línea. Con sede en San Petersburgo.\n\n## Escala\n\nPresupuesto de $1.25 millones por mes. Alcanzaron a 126 millones de estadounidenses en Facebook.\n\n## Consecuencias\n\nEl DOJ acusó a 13 ciudadanos rusos y 3 organizaciones en 2018.",
    excerpt: "Russian troll farm spending $1.25M/month on fake American social media accounts, reaching 126 million Facebook users.",
    excerptEs: "Fábrica de trolls rusa gastando $1.25M/mes en cuentas falsas, alcanzando 126 millones de usuarios de Facebook.",
    sources: [
      { url: null, title: "Mueller Report", type: SourceType.GOVERNMENT, credibility: 5 },
      { url: null, title: "The Disinformation Age by Bennett and Livingston", type: SourceType.ACADEMIC, credibility: 4 },
    ],
    tags: [
      { slug: "russia", name: "Russia", nameEs: "Rusia" },
      { slug: "social-media", name: "Social Media", nameEs: "Redes Sociales" },
    ],
  },
  {
    slug: "nsa-prism",
    slugEs: "nsa-prism",
    title: "NSA PRISM Program",
    titleEs: "Programa PRISM de la NSA",
    aliases: ["PRISM"],
    icebergLevel: 3,
    era: Era.DIGITAL_AGE,
    types: [OperationType.SURVEILLANCE],
    actors: ["United States", "NSA", "GCHQ"],
    targets: ["Global internet users"],
    outcome: Outcome.SUCCESSFUL,
    status: OperationStatus.LEAKED,
    bodyEn: "## Overview\n\nPRISM is a program under which the NSA collects internet communications from major tech companies. Leaked by Snowden in 2013.\n\n## Methods\n\n- Direct access to servers of Google, Facebook, Apple, Microsoft, Yahoo\n- Operated under Section 702 of FISA\n- Companion UPSTREAM programs tapped undersea fiber optic cables\n\n## Consequences\n\nGlobal diplomatic fallout, tech industry encryption reforms, USA FREEDOM Act (2015).",
    bodyEs: "## Resumen\n\nPRISM es un programa de la NSA que recopila comunicaciones de internet de empresas tecnológicas. Filtrado por Snowden en 2013.\n\n## Metodos\n\n- Acceso directo a servidores de Google, Facebook, Apple, Microsoft\n- Operado bajo la Sección 702 de FISA\n\n## Consecuencias\n\nConsecuencias diplomáticas globales y la Ley USA FREEDOM (2015).",
    excerpt: "NSA mass surveillance program collecting internet communications from Google, Facebook, Apple — leaked by Snowden.",
    excerptEs: "Programa de vigilancia masiva de la NSA recopilando comunicaciones de Google, Facebook, Apple — filtrado por Snowden.",
    sources: [
      { url: null, title: "Permanent Record by Edward Snowden", type: SourceType.BOOK, credibility: 5 },
      { url: null, title: "No Place to Hide by Glenn Greenwald", type: SourceType.JOURNALISM, credibility: 5 },
    ],
    tags: [
      { slug: "nsa", name: "NSA", nameEs: "NSA" },
      { slug: "digital-privacy", name: "Digital Privacy", nameEs: "Privacidad Digital" },
    ],
  },
  {
    slug: "cia-torture-program",
    slugEs: "programa-de-tortura-cia",
    title: "CIA Enhanced Interrogation Program",
    titleEs: "Programa de Interrogatorio Mejorado de la CIA",
    aliases: ["CIA Torture Program"],
    icebergLevel: 3,
    era: Era.MODERN,
    types: [OperationType.DECEPTION],
    actors: ["United States", "CIA"],
    targets: ["Terrorism suspects"],
    outcome: Outcome.FAILED,
    status: OperationStatus.DECLASSIFIED,
    bodyEn: "## Overview\n\nThe CIA's \"enhanced interrogation\" program was a systematic regime of torture at black sites following 9/11.\n\n## The Deception\n\nThe CIA misled Congress about effectiveness. The 2014 Senate report concluded the techniques were ineffective and the CIA's claims were false.\n\n## Legacy\n\nNo CIA officials were prosecuted for the program.",
    bodyEs: "## Resumen\n\nEl programa de \"interrogatorio mejorado\" de la CIA fue un regimen de tortura en sitios negros tras el 11-S.\n\n## El Engaño\n\nLa CIA engañó al Congreso sobre la efectividad. El informe del Senado de 2014 concluyó que las tecnicas eran ineficaces.",
    excerpt: "CIA's post-9/11 torture program at global black sites — Senate report proved the agency lied about its effectiveness.",
    excerptEs: "Programa de tortura de la CIA post-11S — el informe del Senado demostró que mintió sobre su efectividad.",
    sources: [
      { url: null, title: "Senate Intelligence Committee Study of the CIA's Detention and Interrogation Program", type: SourceType.GOVERNMENT, credibility: 5 },
      { url: null, title: "The Report (film, 2019)", type: SourceType.VIDEO, credibility: 3 },
    ],
    tags: [
      { slug: "cia", name: "CIA", nameEs: "CIA" },
      { slug: "torture", name: "Torture", nameEs: "Tortura" },
    ],
  },
  {
    slug: "five-eyes",
    slugEs: "cinco-ojos",
    title: "Five Eyes Alliance",
    titleEs: "Alianza Cinco Ojos",
    aliases: ["FVEY", "UKUSA Agreement"],
    icebergLevel: 3,
    era: Era.COLD_WAR,
    types: [OperationType.SURVEILLANCE],
    actors: ["United States", "United Kingdom", "Canada", "Australia", "New Zealand"],
    targets: ["Global communications"],
    outcome: Outcome.ONGOING,
    status: OperationStatus.LEAKED,
    bodyEn: "## Overview\n\nThe Five Eyes is an intelligence alliance of five nations. The framework allows circumventing domestic surveillance laws by having partners spy on each other's citizens.\n\n## Scope\n\nRevealed by Snowden, the alliance operates ECHELON, TEMPORA, and coordinates through XKEYSCORE.\n\n## Expanded Networks\n\nNine Eyes adds Denmark, France, Netherlands, Norway. Fourteen Eyes adds Germany, Belgium, Italy, Spain, Sweden.",
    bodyEs: "## Resumen\n\nLos Cinco Ojos es una alianza de inteligencia de cinco naciones. Permite eludir las leyes de vigilancia nacional haciendo que socios espíen a los ciudadanos de las demás.\n\n## Alcance\n\nRevelado por Snowden, la alianza opera ECHELON, TEMPORA y XKEYSCORE.",
    excerpt: "Intelligence alliance of 5 nations that circumvents domestic surveillance laws by spying on each other's citizens.",
    excerptEs: "Alianza de inteligencia de 5 naciones que elude las leyes de vigilancia espiando a los ciudadanos de las demás.",
    sources: [
      { url: null, title: "The Snowden Files by Luke Harding", type: SourceType.JOURNALISM, credibility: 4 },
      { url: null, title: "@War by Shane Harris", type: SourceType.BOOK, credibility: 4 },
    ],
    tags: [
      { slug: "nsa", name: "NSA", nameEs: "NSA" },
      { slug: "international", name: "International", nameEs: "Internacional" },
    ],
  },

  // ─── Level 4: Alleged (5 ops) ─────────────────────
  {
    slug: "narrative-control",
    slugEs: "control-narrativo",
    title: "Narrative Control Programs",
    titleEs: "Programas de Control Narrativo",
    aliases: ["Strategic Communication"],
    icebergLevel: 4,
    era: Era.DIGITAL_AGE,
    types: [OperationType.PROPAGANDA, OperationType.INFLUENCE_OP, OperationType.DISINFORMATION],
    actors: ["United States", "Department of Defense", "Department of State"],
    targets: ["Social media users"],
    outcome: Outcome.ONGOING,
    status: OperationStatus.ALLEGED,
    bodyEn: "## Overview\n\nNarrative Control refers to alleged ongoing government programs to shape public discourse online.\n\n## Allegations\n\n- The Twitter Files (2022) revealed government agencies flagging content for removal\n- The Global Engagement Center funded organizations that created media blacklists\n- DHS Disinformation Governance Board (briefly established in 2022)\n\n## Current Status\n\nMultiple lawsuits and congressional investigations are ongoing.",
    bodyEs: "## Resumen\n\nEl Control Narrativo se refiere a presuntos programas gubernamentales para moldear el discurso público en línea.\n\n## Alegaciones\n\n- Los Archivos de Twitter (2022) revelaron que agencias señalaban contenido para eliminación\n- La Junta de Gobernanza de Desinformación del DHS (establecida brevemente en 2022)\n\n## Estado Actual\n\nMúltiples demandas e investigaciones están en curso.",
    excerpt: "Alleged government programs shaping online discourse through content moderation pressure and social media influence tools.",
    excerptEs: "Presuntos programas gubernamentales moldeando el discurso en línea a traves de presión de moderación de contenido.",
    sources: [
      { url: null, title: "The Twitter Files (multiple journalists, 2022-2023)", type: SourceType.JOURNALISM, credibility: 3 },
      { url: null, title: "Murthy v. Missouri, Supreme Court Case No. 23-411", type: SourceType.GOVERNMENT, credibility: 4 },
    ],
    tags: [
      { slug: "censorship", name: "Censorship", nameEs: "Censura" },
      { slug: "social-media", name: "Social Media", nameEs: "Redes Sociales" },
    ],
  },
  {
    slug: "brain-warfare",
    slugEs: "guerra-cerebral",
    title: "Brain Warfare / Neuro-Weapons",
    titleEs: "Guerra Cerebral / Neuro-Armas",
    aliases: ["Havana Syndrome", "Directed Energy Weapons"],
    icebergLevel: 4,
    era: Era.DIGITAL_AGE,
    types: [OperationType.MIND_CONTROL, OperationType.SURVEILLANCE],
    actors: ["Unknown", "Russia (alleged)", "United States"],
    targets: ["Diplomats", "Intelligence officers"],
    outcome: Outcome.UNKNOWN,
    status: OperationStatus.ALLEGED,
    bodyEn: "## Overview\n\nBrain warfare encompasses alleged use of directed energy weapons, most prominently \"Havana Syndrome.\"\n\n## Havana Syndrome\n\nBeginning in 2016 at the U.S. Embassy in Havana, diplomats reported hearing strange sounds followed by neurological symptoms.\n\n## Current Status\n\nA 2024 investigation linked some cases to a Russian GRU unit. The intelligence community remains divided.",
    bodyEs: "## Resumen\n\nLa guerra cerebral abarca el presunto uso de armas de energía dirigida, manifestado como el \"Síndrome de La Habana.\"\n\n## Síndrome de La Habana\n\nComenzando en 2016, diplomáticos reportaron sonidos extraños seguidos de síntomas neurológicos.\n\n## Estado Actual\n\nUna investigación de 2024 vinculó algunos casos a una unidad del GRU ruso.",
    excerpt: "Alleged directed energy attacks causing neurological damage to diplomats — linked to possible Russian GRU unit.",
    excerptEs: "Presuntos ataques de energía dirigida causando daño neurológico a diplomáticos.",
    sources: [
      { url: null, title: "National Academy of Sciences Assessment (2020)", type: SourceType.ACADEMIC, credibility: 5 },
      { url: null, title: "The Insider / 60 Minutes Joint Investigation (2024)", type: SourceType.JOURNALISM, credibility: 4 },
    ],
    tags: [
      { slug: "directed-energy", name: "Directed Energy", nameEs: "Energía Dirigida" },
      { slug: "russia", name: "Russia", nameEs: "Rusia" },
    ],
  },
  {
    slug: "operation-earnest-voice",
    slugEs: "operacion-voz-sincera",
    title: "Operation Earnest Voice",
    titleEs: "Operacion Voz Sincera",
    aliases: ["OEV", "Sock Puppet Army"],
    icebergLevel: 4,
    era: Era.DIGITAL_AGE,
    types: [OperationType.PROPAGANDA, OperationType.INFLUENCE_OP],
    actors: ["United States", "U.S. Central Command"],
    targets: ["Foreign social media users"],
    outcome: Outcome.ONGOING,
    status: OperationStatus.ALLEGED,
    bodyEn: "## Overview\n\nOperation Earnest Voice is an astroturfing campaign by the U.S. military, using software to create fake online personas.\n\n## Known Details\n\n- $2.76 million contract to Ntrepid Corporation in 2011\n- Software allows one operator to manage up to 10 fake personas\n\n## Significance\n\nDemonstrates the same influence techniques attributed to adversaries are also employed by the U.S.",
    bodyEs: "## Resumen\n\nLa Operación Voz Sincera es una campaña de astroturfing del ejército de EE.UU. usando software para crear personalidades falsas.\n\n## Detalles\n\n- Contrato de $2.76 millones a Ntrepid Corporation en 2011\n- Un operador puede manejar hasta 10 personalidades falsas\n\n## Importancia\n\nDemuestra que las mismas tecnicas atribuidas a adversarios son empleadas por el gobierno de EE.UU.",
    excerpt: "U.S. military astroturfing program using software to manage fake online personas for influence operations.",
    excerptEs: "Programa de astroturfing del ejército de EE.UU. usando software para personalidades falsas.",
    sources: [
      { url: null, title: "Revealed: US spy operation that manipulates social media (The Guardian, 2011)", type: SourceType.JOURNALISM, credibility: 4 },
      { url: null, title: "USCENTCOM Contract for Online Persona Management", type: SourceType.GOVERNMENT, credibility: 4 },
    ],
    tags: [
      { slug: "astroturfing", name: "Astroturfing", nameEs: "Astroturfing" },
      { slug: "military", name: "Military", nameEs: "Militar" },
    ],
  },
  {
    slug: "pegasus-spyware",
    slugEs: "software-espia-pegasus",
    title: "Pegasus Spyware",
    titleEs: "Software Espía Pegasus",
    aliases: ["NSO Group Spyware"],
    icebergLevel: 4,
    era: Era.DIGITAL_AGE,
    types: [OperationType.SURVEILLANCE],
    actors: ["Israel", "NSO Group", "Multiple governments"],
    targets: ["Journalists", "Activists", "Political opposition"],
    outcome: Outcome.ONGOING,
    status: OperationStatus.LEAKED,
    bodyEn: "## Overview\n\nPegasus is spyware by Israeli NSO Group that can be covertly installed on smartphones.\n\n## Pegasus Project\n\nIn 2021, a leaked list of 50,000+ phone numbers selected for surveillance across 45 countries was revealed.\n\n## Consequences\n\nThe U.S. Commerce Department blacklisted NSO Group in 2021.",
    bodyEs: "## Resumen\n\nPegasus es un software espía de NSO Group de Israel que puede instalarse secretamente en teléfonos.\n\n## Proyecto Pegasus\n\nEn 2021 se reveló una lista de más de 50,000 números de teléfono seleccionados para vigilancia en 45 países.\n\n## Consecuencias\n\nEl Departamento de Comercio de EE.UU. incluyó a NSO Group en lista negra en 2021.",
    excerpt: "Israeli-built spyware that silently infiltrates any smartphone — leaked list revealed 50,000+ targeted numbers across 45 countries.",
    excerptEs: "Software espía israelí que infiltra silenciosamente smartphones — lista filtrada reveló 50,000+ números objetivo.",
    sources: [
      { url: null, title: "Pegasus Project (Forbidden Stories, 2021)", type: SourceType.JOURNALISM, credibility: 5 },
      { url: null, title: "Amnesty International Forensic Methodology Report", type: SourceType.ACADEMIC, credibility: 5 },
    ],
    tags: [
      { slug: "spyware", name: "Spyware", nameEs: "Software Espía" },
      { slug: "israel", name: "Israel", nameEs: "Israel" },
    ],
  },
  {
    slug: "qanon",
    slugEs: "qanon",
    title: "QAnon",
    titleEs: "QAnon",
    aliases: ["Q", "The Storm"],
    icebergLevel: 4,
    era: Era.DIGITAL_AGE,
    types: [OperationType.INFLUENCE_OP, OperationType.PROPAGANDA, OperationType.DISINFORMATION],
    actors: ["Unknown"],
    targets: ["American public", "Global public"],
    outcome: Outcome.ONGOING,
    status: OperationStatus.ALLEGED,
    bodyEn: "## Overview\n\nQAnon is a conspiracy theory movement from 4chan posts in October 2017.\n\n## The Psyop Question\n\nDebate exists whether QAnon is organic, a deliberate info op, or an organic movement amplified by foreign actors.\n\n## Impact\n\nLinked to violence, influenced elections, drove the January 6 Capitol breach.",
    bodyEs: "## Resumen\n\nQAnon es un movimiento conspirativo de publicaciones en 4chan en octubre de 2017.\n\n## La Pregunta Psyop\n\nExiste debate sobre si QAnon es orgánico, una operación deliberada, o amplificado por actores extranjeros.\n\n## Impacto\n\nVinculado a violencia, influyó en elecciones, impulsó la irrupción del Capitolio del 6 de enero.",
    excerpt: "Decentralized conspiracy movement from 4chan that may be a deliberate psyop — amplified by foreign troll networks.",
    excerptEs: "Movimiento conspirativo descentralizado de 4chan que podría ser una operación psicológica deliberada.",
    sources: [
      { url: null, title: "The Genesis of a Conspiracy Theory (The Atlantic, 2020)", type: SourceType.JOURNALISM, credibility: 4 },
      { url: null, title: "QAnon and the Disinformation Megaplex (Journal of Online Trust and Safety)", type: SourceType.ACADEMIC, credibility: 4 },
    ],
    tags: [
      { slug: "conspiracy", name: "Conspiracy Theory", nameEs: "Teoría Conspirativa" },
      { slug: "disinformation", name: "Disinformation", nameEs: "Desinformación" },
    ],
  },

  // ─── Level 5: Deep Conspiracy (5 ops) ─────────────
  {
    slug: "project-blue-beam",
    slugEs: "proyecto-rayo-azul",
    title: "Project Blue Beam",
    titleEs: "Proyecto Rayo Azul",
    aliases: [],
    icebergLevel: 5,
    era: Era.MODERN,
    types: [OperationType.DECEPTION, OperationType.PROPAGANDA],
    actors: ["Unknown", "NASA (alleged)"],
    targets: ["Global population"],
    outcome: Outcome.UNKNOWN,
    status: OperationStatus.ALLEGED,
    bodyEn: "## Overview\n\nProject Blue Beam alleges NASA plans to simulate a \"Second Coming\" using holographic technology.\n\n## Evidence Status\n\n**No credible evidence supports this theory.** Included as an example of how psyop theories evolve.\n\n## Why It Matters\n\nDemonstrates how conspiracy theories borrow real tech concepts and extrapolate them into unfounded scenarios.",
    bodyEs: "## Resumen\n\nEl Proyecto Rayo Azul alega que la NASA planea simular una \"Segunda Venida\" usando tecnología holográfica.\n\n## Estado de la Evidencia\n\n**Ninguna evidencia creíble apoya esta teoría.** Incluida como ejemplo de cómo evolucionan las teorías.\n\n## Por Que Importa\n\nDemuestra cómo las teorías conspirativas toman conceptos tecnológicos reales y los extrapolan.",
    excerpt: "Conspiracy theory alleging NASA plans to simulate a 'Second Coming' via holograms — no credible evidence.",
    excerptEs: "Teoría conspirativa que alega que la NASA planea simular una 'Segunda Venida' via hologramas — sin evidencia creíble.",
    sources: [
      { url: null, title: "Conspiracies and Conspiracy Theories in the Age of Trump (Palgrave Macmillan)", type: SourceType.ACADEMIC, credibility: 3 },
      { url: null, title: "Project Blue Beam by Serge Monast (1994)", type: SourceType.WEBSITE, credibility: 1 },
    ],
    tags: [
      { slug: "conspiracy", name: "Conspiracy Theory", nameEs: "Teoría Conspirativa" },
      { slug: "unverified", name: "Unverified", nameEs: "No Verificado" },
    ],
  },
  {
    slug: "silent-weapons-quiet-wars",
    slugEs: "armas-silenciosas-guerras-tranquilas",
    title: "Silent Weapons for Quiet Wars",
    titleEs: "Armas Silenciosas para Guerras Tranquilas",
    aliases: ["SWQW"],
    icebergLevel: 5,
    era: Era.COLD_WAR,
    types: [OperationType.MIND_CONTROL, OperationType.INFLUENCE_OP],
    actors: ["Unknown"],
    targets: ["Global population"],
    outcome: Outcome.UNKNOWN,
    status: OperationStatus.ALLEGED,
    bodyEn: "## Overview\n\nAn alleged 1979 document describing social engineering via economic modeling.\n\n## Evidence Status\n\n**Almost certainly a hoax.** No authenticated provenance. Linguistic analysis suggests a single libertarian author.\n\n## Why It Matters\n\nPrime example of \"leaked document\" mythology in conspiracy culture.",
    bodyEs: "## Resumen\n\nUn presunto documento de 1979 describiendo ingeniería social via modelado económico.\n\n## Estado de la Evidencia\n\n**Casi con certeza un engaño.** No existe procedencia autenticada.\n\n## Por Que Importa\n\nEjemplo principal de mitología de \"documentos filtrados\" en la cultura conspirativa.",
    excerpt: "Alleged 1979 document describing social engineering via economics — almost certainly a hoax.",
    excerptEs: "Presunto documento de 1979 describiendo ingeniería social via economía — casi con certeza un engaño.",
    sources: [
      { url: null, title: "Conspiracy Theories in American History: An Encyclopedia (ABC-CLIO)", type: SourceType.ACADEMIC, credibility: 4 },
      { url: null, title: "Silent Weapons for Quiet Wars (original, unverified)", type: SourceType.WEBSITE, credibility: 1 },
    ],
    tags: [
      { slug: "conspiracy", name: "Conspiracy Theory", nameEs: "Teoría Conspirativa" },
      { slug: "unverified", name: "Unverified", nameEs: "No Verificado" },
    ],
  },
  {
    slug: "monarch-programming",
    slugEs: "programacion-monarca",
    title: "Monarch Programming",
    titleEs: "Programacion Monarca",
    aliases: ["Project Monarch"],
    icebergLevel: 5,
    era: Era.COLD_WAR,
    types: [OperationType.MIND_CONTROL],
    actors: ["Unknown", "CIA (alleged)"],
    targets: ["Individuals"],
    outcome: Outcome.UNKNOWN,
    status: OperationStatus.ALLEGED,
    bodyEn: "## Overview\n\nMonarch Programming is alleged trauma-based mind control, claimed as a continuation of MKUltra.\n\n## Evidence Status\n\n**No credible evidence exists.** Appears to conflate real MKUltra history with unsubstantiated claims.\n\n## Why It Matters\n\nIllustrates how confirmed operations serve as a \"seed of truth\" for unfounded theories.",
    bodyEs: "## Resumen\n\nLa Programación Monarca es un presunto control mental basado en trauma, como continuación de MKUltra.\n\n## Estado de la Evidencia\n\n**No hay evidencia creíble.** Parece confundir la historia real de MKUltra con afirmaciones infundadas.\n\n## Por Que Importa\n\nIlustra cómo operaciones confirmadas sirven como \"semilla de verdad\" para teorías infundadas.",
    excerpt: "Alleged MKUltra continuation using trauma-based mind control — no credible evidence exists.",
    excerptEs: "Presunta continuación de MKUltra usando control mental basado en trauma — no existe evidencia creíble.",
    sources: [
      { url: null, title: "Conspiracy Culture by Peter Knight", type: SourceType.ACADEMIC, credibility: 3 },
      { url: null, title: "The CIA Doctors by Colin A. Ross", type: SourceType.BOOK, credibility: 2 },
    ],
    tags: [
      { slug: "conspiracy", name: "Conspiracy Theory", nameEs: "Teoría Conspirativa" },
      { slug: "mind-control", name: "Mind Control", nameEs: "Control Mental" },
    ],
  },
  {
    slug: "chemtrail-theory",
    slugEs: "teoria-chemtrails",
    title: "Chemtrail Theory",
    titleEs: "Teoria de los Chemtrails",
    aliases: ["Chemical Trails"],
    icebergLevel: 5,
    era: Era.MODERN,
    types: [OperationType.DECEPTION],
    actors: ["Unknown"],
    targets: ["Global population"],
    outcome: Outcome.UNKNOWN,
    status: OperationStatus.ALLEGED,
    bodyEn: "## Overview\n\nThe chemtrail theory alleges aircraft contrails are chemical agents deliberately sprayed.\n\n## Evidence Status\n\n**Thoroughly debunked.** A 2016 study of 77 atmospheric scientists found zero support.\n\n## The Interesting Kernel\n\nWhile chemtrails as described are fiction, real programs DO exist: cloud seeding, Operation LAC (1957-58), and geoengineering research.\n\n## Why It Matters\n\nDemonstrates how real but limited programs can be extrapolated into global conspiracy narratives.",
    bodyEs: "## Resumen\n\nLa teoría de los chemtrails alega que las estelas de aviones son agentes químicos rociados deliberadamente.\n\n## Estado de la Evidencia\n\n**Completamente desmentida.** Un estudio de 2016 de 77 científicos atmosfericos no encontró apoyo.\n\n## El Núcleo Interesante\n\nProgramas reales SÍ existen: siembra de nubes, Operación LAC (1957-58).\n\n## Por Que Importa\n\nDemuestra cómo programas reales pueden extrapolarse en narrativas conspirativas globales.",
    excerpt: "Debunked theory that aircraft contrails are chemical spraying — but real programs like Operation LAC provide factual anchors.",
    excerptEs: "Teoría desmentida de que estelas de aviones son fumigación química — pero programas reales proporcionan anclas factuales.",
    sources: [
      { url: null, title: "Quantifying expert consensus (Environmental Research Letters, 2016)", type: SourceType.ACADEMIC, credibility: 5 },
      { url: null, title: "Operation LAC declassified documents", type: SourceType.GOVERNMENT, credibility: 5 },
    ],
    tags: [
      { slug: "conspiracy", name: "Conspiracy Theory", nameEs: "Teoría Conspirativa" },
      { slug: "weather", name: "Weather Modification", nameEs: "Modificación del Clima" },
    ],
  },
  {
    slug: "constant-informational-struggle",
    slugEs: "lucha-informativa-constante",
    title: "Constant Informational Struggle",
    titleEs: "Lucha Informativa Constante",
    aliases: ["Information Confrontation"],
    icebergLevel: 5,
    era: Era.DIGITAL_AGE,
    types: [OperationType.PROPAGANDA, OperationType.INFLUENCE_OP, OperationType.DISINFORMATION],
    actors: ["Russia", "GRU", "FSB", "SVR"],
    targets: ["Western democracies", "NATO countries"],
    outcome: Outcome.ONGOING,
    status: OperationStatus.ALLEGED,
    bodyEn: "## Overview\n\nRussia's alleged doctrine of permanent information warfare against Western democracies.\n\n## The Doctrine\n\nThe Gerasimov Doctrine (2013) formalized non-linear warfare where information operations are primary.\n\n## Why Level 5\n\nIndividual components are well-documented, but the theory that these constitute a unified permanent doctrine remains debated.",
    bodyEs: "## Resumen\n\nPresunta doctrina de Rusia de guerra informativa permanente contra democracias occidentales.\n\n## La Doctrina\n\nLa Doctrina Gerasimov (2013) formalizó la guerra no lineal donde las operaciones de información son primarias.\n\n## Por Que Nivel 5\n\nComponentes individuales están documentados, pero la doctrina unificada sigue siendo debatida.",
    excerpt: "Russia's alleged doctrine of permanent information warfare — individual ops are proven, unified doctrine is debated.",
    excerptEs: "Presunta doctrina rusa de guerra informativa permanente — operaciones individuales probadas, doctrina unificada debatida.",
    sources: [
      { url: null, title: "The Gerasimov Doctrine (Military-Industrial Kurier, 2013)", type: SourceType.GOVERNMENT, credibility: 4 },
      { url: null, title: "Active Measures by Thomas Rid", type: SourceType.BOOK, credibility: 5 },
    ],
    tags: [
      { slug: "russia", name: "Russia", nameEs: "Rusia" },
      { slug: "information-warfare", name: "Information Warfare", nameEs: "Guerra Informativa" },
    ],
  },
];

async function main() {
  console.log("Seeding database...");

  // Upsert all tags first
  const tagMap = new Map<string, string>();

  for (const op of operations) {
    for (const tag of op.tags) {
      if (!tagMap.has(tag.slug)) {
        const created = await prisma.tag.upsert({
          where: { slug: tag.slug },
          update: { name: tag.name, nameEs: tag.nameEs },
          create: { slug: tag.slug, name: tag.name, nameEs: tag.nameEs },
        });
        tagMap.set(tag.slug, created.id);
      }
    }
  }

  console.log(`Created ${tagMap.size} tags`);

  // Create operations with sources and tag connections
  for (const op of operations) {
    const tagIds = op.tags.map((t) => tagMap.get(t.slug)!).filter(Boolean);

    await prisma.operation.upsert({
      where: { slug: op.slug },
      update: {
        slugEs: op.slugEs,
        title: op.title,
        titleEs: op.titleEs,
        aliases: op.aliases,
        icebergLevel: op.icebergLevel,
        era: op.era,
        types: op.types,
        actors: op.actors,
        targets: op.targets,
        outcome: op.outcome,
        status: op.status,
        bodyEn: op.bodyEn,
        bodyEs: op.bodyEs,
        excerpt: op.excerpt,
        excerptEs: op.excerptEs,
        tags: { set: tagIds.map((id) => ({ id })) },
      },
      create: {
        slug: op.slug,
        slugEs: op.slugEs,
        title: op.title,
        titleEs: op.titleEs,
        aliases: op.aliases,
        icebergLevel: op.icebergLevel,
        era: op.era,
        types: op.types,
        actors: op.actors,
        targets: op.targets,
        outcome: op.outcome,
        status: op.status,
        bodyEn: op.bodyEn,
        bodyEs: op.bodyEs,
        excerpt: op.excerpt,
        excerptEs: op.excerptEs,
        tags: { connect: tagIds.map((id) => ({ id })) },
        sources: {
          create: op.sources.map((s) => ({
            url: s.url,
            title: s.title,
            type: s.type,
            credibility: s.credibility,
          })),
        },
      },
    });

    console.log(`  Seeded: ${op.title} (Level ${op.icebergLevel})`);
  }

  // Create related operation links
  const mkultra = await prisma.operation.findUnique({ where: { slug: "mkultra" } });
  const artichoke = await prisma.operation.findUnique({ where: { slug: "project-artichoke" } });
  const cointelpro = await prisma.operation.findUnique({ where: { slug: "cointelpro" } });
  const mockingbird = await prisma.operation.findUnique({ where: { slug: "operation-mockingbird" } });
  const cambridge = await prisma.operation.findUnique({ where: { slug: "cambridge-analytica" } });
  const ira = await prisma.operation.findUnique({ where: { slug: "internet-research-agency" } });

  if (mkultra && artichoke) {
    await prisma.operation.update({
      where: { id: mkultra.id },
      data: { relatedOps: { connect: [{ id: artichoke.id }] } },
    });
  }
  if (cointelpro && mockingbird) {
    await prisma.operation.update({
      where: { id: cointelpro.id },
      data: { relatedOps: { connect: [{ id: mockingbird.id }] } },
    });
  }
  if (cambridge && ira) {
    await prisma.operation.update({
      where: { id: cambridge.id },
      data: { relatedOps: { connect: [{ id: ira.id }] } },
    });
  }

  console.log("\nSeed complete!");
  console.log(`  Operations: ${operations.length}`);
  console.log(`  Tags: ${tagMap.size}`);
  console.log(`  Sources: ${operations.reduce((sum, op) => sum + op.sources.length, 0)}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
