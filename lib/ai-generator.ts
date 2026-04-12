import type { AIGeneratedQuestion } from './types'

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36)

// Comprehensive question templates organized by topic and difficulty
const topicTemplates: Record<string, { 
  easy: Array<{ text: string; options: string[]; correct: number; explanation: string }>;
  medium: Array<{ text: string; options: string[]; correct: number; explanation: string }>;
  hard: Array<{ text: string; options: string[]; correct: number; explanation: string }>;
}> = {
  'Programming': {
    easy: [
      { text: 'What does HTML stand for?', options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Hyper Transfer Markup Language', 'Home Tool Markup Language'], correct: 0, explanation: 'HTML stands for Hyper Text Markup Language, used for creating web pages.' },
      { text: 'Which keyword is used to declare a variable in JavaScript?', options: ['var', 'int', 'string', 'declare'], correct: 0, explanation: 'In JavaScript, var, let, and const are used to declare variables. var was the original keyword.' },
      { text: 'What symbol is used for single-line comments in JavaScript?', options: ['#', '//', '/*', '--'], correct: 1, explanation: 'JavaScript uses // for single-line comments and /* */ for multi-line comments.' },
      { text: 'Which HTML tag is used for the largest heading?', options: ['<h6>', '<h1>', '<header>', '<heading>'], correct: 1, explanation: 'The <h1> tag defines the most important heading, with <h6> being the smallest.' },
      { text: 'What does CSS stand for?', options: ['Cascading Style Sheets', 'Computer Style Sheets', 'Creative Style Sheets', 'Colorful Style Sheets'], correct: 0, explanation: 'CSS stands for Cascading Style Sheets, used to style HTML elements.' },
    ],
    medium: [
      { text: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n^2)', 'O(1)'], correct: 1, explanation: 'Binary search divides the search space in half each time, resulting in O(log n) complexity.' },
      { text: 'Which data structure uses LIFO principle?', options: ['Queue', 'Stack', 'Array', 'Linked List'], correct: 1, explanation: 'Stack follows Last In First Out (LIFO) principle where the last element added is the first to be removed.' },
      { text: 'What is the output of 2 + "2" in JavaScript?', options: ['4', '22', 'Error', 'undefined'], correct: 1, explanation: 'JavaScript converts the number to string and concatenates, resulting in "22".' },
      { text: 'Which method adds an element to the end of an array in JavaScript?', options: ['push()', 'pop()', 'shift()', 'unshift()'], correct: 0, explanation: 'push() adds elements to the end, while unshift() adds to the beginning.' },
      { text: 'What is the purpose of the "this" keyword in JavaScript?', options: ['Declares a new variable', 'Refers to the current object', 'Creates a loop', 'Imports a module'], correct: 1, explanation: 'The "this" keyword refers to the object that is currently executing the code.' },
    ],
    hard: [
      { text: 'What is the time complexity of merging two sorted arrays?', options: ['O(n)', 'O(n log n)', 'O(n^2)', 'O(log n)'], correct: 0, explanation: 'Merging two sorted arrays requires visiting each element once, resulting in O(n) where n is total elements.' },
      { text: 'Which design pattern ensures a class has only one instance?', options: ['Factory', 'Singleton', 'Observer', 'Decorator'], correct: 1, explanation: 'The Singleton pattern restricts instantiation of a class to one single instance.' },
      { text: 'What is a closure in JavaScript?', options: ['A syntax error', 'A function with access to its outer scope', 'A type of loop', 'A database connection'], correct: 1, explanation: 'A closure is a function that retains access to variables from its outer (enclosing) scope even after the outer function has returned.' },
      { text: 'What is the difference between == and === in JavaScript?', options: ['No difference', '=== checks type and value, == only value', '== is faster', '=== is deprecated'], correct: 1, explanation: '=== (strict equality) checks both type and value, while == performs type coercion before comparison.' },
      { text: 'What is memoization in programming?', options: ['Memory leak detection', 'Caching function results', 'Database optimization', 'Code compilation'], correct: 1, explanation: 'Memoization is an optimization technique that stores results of expensive function calls to avoid redundant computations.' },
    ]
  },
  'Mathematics': {
    easy: [
      { text: 'What is 15% of 200?', options: ['15', '30', '25', '35'], correct: 1, explanation: '15% of 200 = (15/100) × 200 = 30.' },
      { text: 'What is the square root of 144?', options: ['10', '11', '12', '14'], correct: 2, explanation: '12 × 12 = 144, so √144 = 12.' },
      { text: 'If x + 5 = 12, what is x?', options: ['5', '6', '7', '17'], correct: 2, explanation: 'Subtracting 5 from both sides: x = 12 - 5 = 7.' },
      { text: 'What is the perimeter of a square with side 5 cm?', options: ['10 cm', '15 cm', '20 cm', '25 cm'], correct: 2, explanation: 'Perimeter of square = 4 × side = 4 × 5 = 20 cm.' },
      { text: 'How many degrees are in a right angle?', options: ['45°', '90°', '180°', '360°'], correct: 1, explanation: 'A right angle measures exactly 90 degrees.' },
    ],
    medium: [
      { text: 'What is the derivative of x^2?', options: ['x', '2x', '2', 'x^2'], correct: 1, explanation: 'Using the power rule, d/dx(x^n) = nx^(n-1), so d/dx(x^2) = 2x.' },
      { text: 'What is the value of sin(90°)?', options: ['0', '1', '-1', '0.5'], correct: 1, explanation: 'The sine of 90 degrees equals 1, which is the maximum value of the sine function.' },
      { text: 'If a triangle has angles 60°, 60°, and 60°, what type is it?', options: ['Isosceles', 'Scalene', 'Equilateral', 'Right'], correct: 2, explanation: 'A triangle with all equal angles (60° each) is an equilateral triangle.' },
      { text: 'What is the sum of interior angles of a pentagon?', options: ['360°', '540°', '720°', '180°'], correct: 1, explanation: 'Sum of interior angles = (n-2) × 180° = (5-2) × 180° = 540°.' },
      { text: 'What is the value of log₁₀(1000)?', options: ['2', '3', '4', '10'], correct: 1, explanation: 'log₁₀(1000) = log₁₀(10³) = 3, since 10³ = 1000.' },
    ],
    hard: [
      { text: 'What is the integral of 1/x?', options: ['x', 'ln|x| + C', '1/x² + C', 'e^x + C'], correct: 1, explanation: 'The integral of 1/x is ln|x| + C, where C is the constant of integration.' },
      { text: 'What is the limit of (sin x)/x as x approaches 0?', options: ['0', '1', 'undefined', 'infinity'], correct: 1, explanation: 'This is a famous limit: lim(x→0) sin(x)/x = 1.' },
      { text: 'If f(x) = e^(2x), what is f\'(x)?', options: ['e^(2x)', '2e^(2x)', 'e^x', '2e^x'], correct: 1, explanation: 'Using chain rule: d/dx[e^(2x)] = e^(2x) × 2 = 2e^(2x).' },
      { text: 'What is the determinant of a 2×2 matrix [[a,b],[c,d]]?', options: ['a+d', 'ad-bc', 'ac-bd', 'ab+cd'], correct: 1, explanation: 'The determinant of a 2×2 matrix is calculated as ad - bc.' },
      { text: 'What is the Taylor series expansion of e^x at x=0 (first 3 terms)?', options: ['1 + x + x²', '1 + x + x²/2', 'x + x²/2 + x³/6', '1 + x/2 + x²/4'], correct: 1, explanation: 'e^x = 1 + x + x²/2! + x³/3! + ... The first three terms are 1 + x + x²/2.' },
    ]
  },
  'Physics': {
    easy: [
      { text: 'What is the SI unit of force?', options: ['Joule', 'Newton', 'Watt', 'Pascal'], correct: 1, explanation: 'Newton (N) is the SI unit of force, defined as kg⋅m/s².' },
      { text: 'What is the speed of sound approximately in air?', options: ['100 m/s', '343 m/s', '1000 m/s', '3000 m/s'], correct: 1, explanation: 'The speed of sound in air at 20°C is approximately 343 m/s.' },
      { text: 'Which color of visible light has the longest wavelength?', options: ['Violet', 'Blue', 'Green', 'Red'], correct: 3, explanation: 'Red light has the longest wavelength (~700nm) in the visible spectrum.' },
      { text: 'What is the acceleration due to gravity on Earth?', options: ['8.9 m/s²', '9.8 m/s²', '10.8 m/s²', '11.8 m/s²'], correct: 1, explanation: 'The standard acceleration due to gravity on Earth is approximately 9.8 m/s².' },
      { text: 'What type of energy does a moving car have?', options: ['Potential', 'Kinetic', 'Chemical', 'Nuclear'], correct: 1, explanation: 'A moving object possesses kinetic energy due to its motion.' },
    ],
    medium: [
      { text: 'What is Newton\'s first law also known as?', options: ['Law of Acceleration', 'Law of Inertia', 'Law of Action-Reaction', 'Law of Gravity'], correct: 1, explanation: 'Newton\'s first law is the Law of Inertia - an object at rest stays at rest unless acted upon by a force.' },
      { text: 'What is the formula for kinetic energy?', options: ['mv', '½mv²', 'mgh', 'ma'], correct: 1, explanation: 'Kinetic energy = ½mv², where m is mass and v is velocity.' },
      { text: 'What is absolute zero in Celsius?', options: ['-273.15°C', '-100°C', '0°C', '-459.67°C'], correct: 0, explanation: 'Absolute zero is -273.15°C or 0 Kelvin, the lowest possible temperature.' },
      { text: 'What is the speed of light in vacuum?', options: ['3×10^6 m/s', '3×10^8 m/s', '3×10^10 m/s', '3×10^5 m/s'], correct: 1, explanation: 'The speed of light in vacuum is approximately 3×10^8 meters per second.' },
      { text: 'What happens to the period of a pendulum if its length is quadrupled?', options: ['Doubles', 'Halves', 'Quadruples', 'Stays same'], correct: 0, explanation: 'Period T = 2π√(L/g). If L becomes 4L, T becomes 2T (doubles).' },
    ],
    hard: [
      { text: 'What is the de Broglie wavelength formula?', options: ['λ = h/p', 'λ = p/h', 'λ = hf', 'λ = c/f'], correct: 0, explanation: 'The de Broglie wavelength λ = h/p, where h is Planck\'s constant and p is momentum.' },
      { text: 'What is the relationship between electric field E and potential V?', options: ['E = V', 'E = -dV/dr', 'E = V/r', 'E = V×r'], correct: 1, explanation: 'The electric field is the negative gradient of the electric potential: E = -dV/dr.' },
      { text: 'What is the time dilation factor in special relativity?', options: ['γ = √(1-v²/c²)', 'γ = 1/√(1-v²/c²)', 'γ = v/c', 'γ = c/v'], correct: 1, explanation: 'The Lorentz factor γ = 1/√(1-v²/c²) describes time dilation and length contraction.' },
      { text: 'What is the uncertainty principle inequality?', options: ['ΔxΔp ≥ ℏ/2', 'ΔxΔp = 0', 'ΔxΔp ≤ ℏ', 'ΔxΔp = ℏ'], correct: 0, explanation: 'Heisenberg\'s uncertainty principle states ΔxΔp ≥ ℏ/2 (reduced Planck constant divided by 2).' },
      { text: 'What is the Stefan-Boltzmann law for black body radiation?', options: ['P = σT²', 'P = σT⁴', 'P = σ/T⁴', 'P = T⁴/σ'], correct: 1, explanation: 'The Stefan-Boltzmann law states that power radiated is proportional to T⁴: P = σAT⁴.' },
    ]
  },
  'Chemistry': {
    easy: [
      { text: 'What is the chemical symbol for gold?', options: ['Go', 'Gd', 'Au', 'Ag'], correct: 2, explanation: 'Gold symbol Au comes from Latin "aurum" meaning gold.' },
      { text: 'What is the pH of pure water?', options: ['0', '7', '14', '1'], correct: 1, explanation: 'Pure water has a neutral pH of 7, neither acidic nor basic.' },
      { text: 'What is the most abundant gas in Earth\'s atmosphere?', options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Argon'], correct: 2, explanation: 'Nitrogen makes up about 78% of Earth\'s atmosphere.' },
      { text: 'What is the chemical formula for water?', options: ['H2O', 'CO2', 'NaCl', 'O2'], correct: 0, explanation: 'Water is H2O - two hydrogen atoms bonded to one oxygen atom.' },
      { text: 'How many electrons does a neutral carbon atom have?', options: ['4', '6', '8', '12'], correct: 1, explanation: 'Carbon has atomic number 6, meaning it has 6 protons and 6 electrons when neutral.' },
    ],
    medium: [
      { text: 'How many electrons can the first electron shell hold?', options: ['2', '8', '18', '32'], correct: 0, explanation: 'The first electron shell (K shell) can hold a maximum of 2 electrons.' },
      { text: 'What type of bond involves sharing of electrons?', options: ['Ionic', 'Covalent', 'Metallic', 'Hydrogen'], correct: 1, explanation: 'Covalent bonds are formed when atoms share electron pairs.' },
      { text: 'What is the molar mass of CO2?', options: ['28 g/mol', '32 g/mol', '44 g/mol', '46 g/mol'], correct: 2, explanation: 'CO2 = 12 (C) + 2×16 (O) = 44 g/mol.' },
      { text: 'Which element has the highest electronegativity?', options: ['Oxygen', 'Nitrogen', 'Fluorine', 'Chlorine'], correct: 2, explanation: 'Fluorine has the highest electronegativity (3.98 on Pauling scale) of all elements.' },
      { text: 'What is the oxidation state of oxygen in H2O?', options: ['+2', '-2', '0', '-1'], correct: 1, explanation: 'Oxygen typically has an oxidation state of -2 in compounds like water.' },
    ],
    hard: [
      { text: 'What is the hybridization of carbon in ethene (C2H4)?', options: ['sp', 'sp²', 'sp³', 'sp³d'], correct: 1, explanation: 'In ethene, carbon atoms are sp² hybridized, forming a planar structure with a double bond.' },
      { text: 'What is the Gibbs free energy equation?', options: ['G = H + TS', 'G = H - TS', 'G = H × TS', 'G = H / TS'], correct: 1, explanation: 'Gibbs free energy G = H - TS, where H is enthalpy, T is temperature, and S is entropy.' },
      { text: 'What is the rate law for a second-order reaction A → products?', options: ['r = k[A]', 'r = k[A]²', 'r = k', 'r = k[A]^0.5'], correct: 1, explanation: 'For a second-order reaction, rate = k[A]², where the rate depends on the square of concentration.' },
      { text: 'What is Le Chatelier\'s principle about?', options: ['Reaction rates', 'Equilibrium shifts', 'Electron configuration', 'Molecular geometry'], correct: 1, explanation: 'Le Chatelier\'s principle states that a system at equilibrium will shift to counteract any change imposed on it.' },
      { text: 'What is the bond angle in a tetrahedral molecule?', options: ['90°', '109.5°', '120°', '180°'], correct: 1, explanation: 'Tetrahedral molecules have bond angles of approximately 109.5° due to sp³ hybridization.' },
    ]
  },
  'Biology': {
    easy: [
      { text: 'What is the basic unit of life?', options: ['Atom', 'Molecule', 'Cell', 'Tissue'], correct: 2, explanation: 'The cell is the basic structural and functional unit of all living organisms.' },
      { text: 'What is the powerhouse of the cell?', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi body'], correct: 1, explanation: 'Mitochondria produce ATP through cellular respiration, providing energy for the cell.' },
      { text: 'What type of blood cells fight infection?', options: ['Red blood cells', 'White blood cells', 'Platelets', 'Plasma'], correct: 1, explanation: 'White blood cells (leukocytes) are part of the immune system and fight infections.' },
      { text: 'What gas do plants absorb from the atmosphere?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], correct: 2, explanation: 'Plants absorb carbon dioxide during photosynthesis to produce glucose and oxygen.' },
      { text: 'How many chromosomes do humans have?', options: ['23', '46', '44', '48'], correct: 1, explanation: 'Humans have 46 chromosomes (23 pairs) in most body cells.' },
    ],
    medium: [
      { text: 'Which organelle contains genetic material?', options: ['Ribosome', 'Nucleus', 'Lysosome', 'Vacuole'], correct: 1, explanation: 'The nucleus contains DNA, the genetic material that controls cell activities.' },
      { text: 'What is the process by which plants make food?', options: ['Respiration', 'Photosynthesis', 'Digestion', 'Fermentation'], correct: 1, explanation: 'Photosynthesis is the process where plants use sunlight to convert CO2 and water into glucose.' },
      { text: 'What are the building blocks of proteins?', options: ['Nucleotides', 'Amino acids', 'Fatty acids', 'Monosaccharides'], correct: 1, explanation: 'Proteins are made up of amino acids linked by peptide bonds.' },
      { text: 'What is the function of ribosomes?', options: ['Energy production', 'Protein synthesis', 'Cell division', 'Waste removal'], correct: 1, explanation: 'Ribosomes are the cellular organelles responsible for protein synthesis.' },
      { text: 'Which phase of the cell cycle involves DNA replication?', options: ['G1', 'S', 'G2', 'M'], correct: 1, explanation: 'The S (synthesis) phase is when DNA replication occurs.' },
    ],
    hard: [
      { text: 'What is the role of ATP synthase in cellular respiration?', options: ['Breaks down glucose', 'Produces ATP using proton gradient', 'Transports oxygen', 'Synthesizes proteins'], correct: 1, explanation: 'ATP synthase uses the proton gradient created by the electron transport chain to produce ATP.' },
      { text: 'What type of RNA carries amino acids to ribosomes?', options: ['mRNA', 'tRNA', 'rRNA', 'snRNA'], correct: 1, explanation: 'Transfer RNA (tRNA) carries specific amino acids to the ribosome during translation.' },
      { text: 'What is the function of telomeres?', options: ['Protein coding', 'Protecting chromosome ends', 'RNA splicing', 'Cell signaling'], correct: 1, explanation: 'Telomeres are protective caps at chromosome ends that prevent degradation and fusion.' },
      { text: 'What enzyme unwinds DNA during replication?', options: ['DNA polymerase', 'Helicase', 'Ligase', 'Primase'], correct: 1, explanation: 'Helicase unwinds the DNA double helix by breaking hydrogen bonds between base pairs.' },
      { text: 'What is the Krebs cycle also known as?', options: ['Glycolysis', 'Citric acid cycle', 'Electron transport', 'Calvin cycle'], correct: 1, explanation: 'The Krebs cycle is also called the citric acid cycle or TCA cycle, occurring in mitochondria.' },
    ]
  },
  'Computer Science': {
    easy: [
      { text: 'What does CPU stand for?', options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Computer Processing Unit'], correct: 0, explanation: 'CPU stands for Central Processing Unit, the brain of the computer.' },
      { text: 'What is 1024 bytes equal to?', options: ['1 Megabyte', '1 Kilobyte', '1 Gigabyte', '1 Bit'], correct: 1, explanation: '1024 bytes = 1 Kilobyte (KB) in binary notation.' },
      { text: 'What does RAM stand for?', options: ['Read Access Memory', 'Random Access Memory', 'Run Application Memory', 'Rapid Access Module'], correct: 1, explanation: 'RAM stands for Random Access Memory, used for temporary data storage.' },
      { text: 'What is the binary representation of decimal 5?', options: ['100', '101', '110', '111'], correct: 1, explanation: '5 in decimal = 101 in binary (4+0+1 = 5).' },
      { text: 'Which device is used for output?', options: ['Keyboard', 'Mouse', 'Monitor', 'Scanner'], correct: 2, explanation: 'A monitor displays output from the computer to the user.' },
    ],
    medium: [
      { text: 'Which protocol is used for secure web browsing?', options: ['HTTP', 'FTP', 'HTTPS', 'SMTP'], correct: 2, explanation: 'HTTPS (HTTP Secure) uses SSL/TLS encryption for secure communication.' },
      { text: 'What is the binary representation of decimal 10?', options: ['1010', '1100', '1001', '1011'], correct: 0, explanation: '10 in decimal = 1010 in binary (8+0+2+0 = 10).' },
      { text: 'Which sorting algorithm has the best average time complexity?', options: ['Bubble Sort', 'Selection Sort', 'Quick Sort', 'Insertion Sort'], correct: 2, explanation: 'Quick Sort has O(n log n) average time complexity, better than O(n²) of others.' },
      { text: 'What is the purpose of DNS?', options: ['Data encryption', 'Domain name to IP translation', 'File transfer', 'Email routing'], correct: 1, explanation: 'DNS (Domain Name System) translates domain names to IP addresses.' },
      { text: 'What data structure is used for BFS traversal?', options: ['Stack', 'Queue', 'Heap', 'Tree'], correct: 1, explanation: 'Breadth-First Search uses a Queue to visit nodes level by level.' },
    ],
    hard: [
      { text: 'What is the amortized time complexity of dynamic array insertion?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'], correct: 0, explanation: 'Though occasional resizing is O(n), amortized analysis shows insertion is O(1) on average.' },
      { text: 'What problem does the dining philosophers problem illustrate?', options: ['Memory leak', 'Deadlock', 'Buffer overflow', 'Race condition'], correct: 1, explanation: 'The dining philosophers problem illustrates deadlock and resource contention in concurrent systems.' },
      { text: 'What is the space complexity of merge sort?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correct: 2, explanation: 'Merge sort requires O(n) auxiliary space for the merge operation.' },
      { text: 'What is a B-tree primarily used for?', options: ['In-memory sorting', 'Database indexing', 'Graph traversal', 'String matching'], correct: 1, explanation: 'B-trees are self-balancing trees optimized for disk-based database indexing.' },
      { text: 'What is the CAP theorem about?', options: ['CPU performance', 'Distributed systems trade-offs', 'Memory allocation', 'Network protocols'], correct: 1, explanation: 'CAP theorem states that distributed systems can only guarantee 2 of 3: Consistency, Availability, Partition tolerance.' },
    ]
  },
  'General Knowledge': {
    easy: [
      { text: 'Which is the largest ocean on Earth?', options: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], correct: 2, explanation: 'The Pacific Ocean is the largest, covering about 63 million square miles.' },
      { text: 'What is the capital of France?', options: ['London', 'Berlin', 'Paris', 'Rome'], correct: 2, explanation: 'Paris is the capital and largest city of France.' },
      { text: 'How many continents are there on Earth?', options: ['5', '6', '7', '8'], correct: 2, explanation: 'There are 7 continents: Africa, Antarctica, Asia, Australia, Europe, North America, and South America.' },
      { text: 'What is the tallest mountain in the world?', options: ['K2', 'Kangchenjunga', 'Mount Everest', 'Lhotse'], correct: 2, explanation: 'Mount Everest at 8,848.86 meters is the tallest mountain above sea level.' },
      { text: 'Which planet is known as the Red Planet?', options: ['Venus', 'Jupiter', 'Mars', 'Saturn'], correct: 2, explanation: 'Mars appears red due to iron oxide (rust) on its surface.' },
    ],
    medium: [
      { text: 'Who wrote "Romeo and Juliet"?', options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'], correct: 1, explanation: 'William Shakespeare wrote Romeo and Juliet around 1594-1596.' },
      { text: 'What is the capital of Australia?', options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], correct: 2, explanation: 'Canberra is the capital city of Australia, not Sydney or Melbourne.' },
      { text: 'What year did World War II end?', options: ['1943', '1944', '1945', '1946'], correct: 2, explanation: 'World War II ended in 1945 with the surrender of Japan in September.' },
      { text: 'Which element has the symbol Fe?', options: ['Fluorine', 'Iron', 'Francium', 'Fermium'], correct: 1, explanation: 'Fe is the symbol for Iron, from Latin "ferrum".' },
      { text: 'What is the largest country by area?', options: ['Canada', 'China', 'USA', 'Russia'], correct: 3, explanation: 'Russia is the largest country, covering about 17.1 million square kilometers.' },
    ],
    hard: [
      { text: 'In what year was the United Nations founded?', options: ['1942', '1945', '1948', '1950'], correct: 1, explanation: 'The United Nations was founded on October 24, 1945, after World War II.' },
      { text: 'What is the smallest country in the world by area?', options: ['Monaco', 'San Marino', 'Vatican City', 'Liechtenstein'], correct: 2, explanation: 'Vatican City is the smallest country, covering just 0.44 square kilometers.' },
      { text: 'Who painted the Sistine Chapel ceiling?', options: ['Leonardo da Vinci', 'Raphael', 'Michelangelo', 'Donatello'], correct: 2, explanation: 'Michelangelo painted the Sistine Chapel ceiling between 1508 and 1512.' },
      { text: 'What is the currency of Japan?', options: ['Yuan', 'Won', 'Yen', 'Ringgit'], correct: 2, explanation: 'The Japanese Yen (¥) is the official currency of Japan.' },
      { text: 'Which treaty established the European Union?', options: ['Treaty of Rome', 'Treaty of Paris', 'Maastricht Treaty', 'Lisbon Treaty'], correct: 2, explanation: 'The Maastricht Treaty, signed in 1992, established the European Union.' },
    ]
  },
  'Science': {
    easy: [
      { text: 'What planet is closest to the Sun?', options: ['Venus', 'Earth', 'Mercury', 'Mars'], correct: 2, explanation: 'Mercury is the closest planet to the Sun at about 58 million km.' },
      { text: 'What is the hardest natural substance?', options: ['Gold', 'Iron', 'Diamond', 'Platinum'], correct: 2, explanation: 'Diamond is the hardest naturally occurring substance, rating 10 on Mohs scale.' },
      { text: 'What is the largest organ in the human body?', options: ['Liver', 'Brain', 'Skin', 'Heart'], correct: 2, explanation: 'The skin is the largest organ, covering about 2 square meters in adults.' },
      { text: 'How many bones are in the adult human body?', options: ['106', '206', '306', '406'], correct: 1, explanation: 'The adult human body has 206 bones (babies have about 270 which fuse over time).' },
      { text: 'What causes the seasons on Earth?', options: ['Distance from Sun', 'Earth\'s tilt', 'Moon\'s gravity', 'Solar flares'], correct: 1, explanation: 'Earth\'s 23.5° axial tilt causes seasons as different hemispheres receive varying sunlight.' },
    ],
    medium: [
      { text: 'What is the most abundant element in the universe?', options: ['Oxygen', 'Carbon', 'Hydrogen', 'Helium'], correct: 2, explanation: 'Hydrogen makes up about 75% of all normal matter in the universe.' },
      { text: 'What type of rock is formed from cooled lava?', options: ['Sedimentary', 'Metamorphic', 'Igneous', 'Mineral'], correct: 2, explanation: 'Igneous rocks form when molten rock (magma or lava) cools and solidifies.' },
      { text: 'What is the chemical formula for table salt?', options: ['NaCl', 'KCl', 'CaCl2', 'MgCl2'], correct: 0, explanation: 'Table salt is sodium chloride (NaCl), an ionic compound.' },
      { text: 'How long does light from the Sun take to reach Earth?', options: ['1 second', '8 minutes', '1 hour', '24 hours'], correct: 1, explanation: 'Light travels at ~300,000 km/s, taking about 8 minutes 20 seconds to reach Earth.' },
      { text: 'What is the primary function of red blood cells?', options: ['Fighting infection', 'Blood clotting', 'Carrying oxygen', 'Producing antibodies'], correct: 2, explanation: 'Red blood cells contain hemoglobin which binds and transports oxygen throughout the body.' },
    ],
    hard: [
      { text: 'What is the Schwarzschild radius?', options: ['Star\'s core size', 'Event horizon radius', 'Orbital radius', 'Nuclear radius'], correct: 1, explanation: 'The Schwarzschild radius defines the event horizon of a non-rotating black hole.' },
      { text: 'What is the half-life of Carbon-14?', options: ['1,730 years', '5,730 years', '10,730 years', '15,730 years'], correct: 1, explanation: 'Carbon-14 has a half-life of approximately 5,730 years, used in radiocarbon dating.' },
      { text: 'What causes the aurora borealis?', options: ['Moonlight reflection', 'Solar wind particles', 'Volcanic gases', 'Ocean currents'], correct: 1, explanation: 'Auroras occur when charged particles from solar wind interact with atmospheric gases.' },
      { text: 'What is the Chandrasekhar limit?', options: ['Star temperature limit', 'White dwarf mass limit', 'Planet size limit', 'Galaxy rotation limit'], correct: 1, explanation: 'The Chandrasekhar limit (~1.4 solar masses) is the maximum mass of a stable white dwarf star.' },
      { text: 'What is CRISPR-Cas9 used for?', options: ['Data encryption', 'Gene editing', 'Drug delivery', 'Protein synthesis'], correct: 1, explanation: 'CRISPR-Cas9 is a revolutionary gene-editing technology that can modify DNA sequences.' },
    ]
  },
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Find the best matching topic from templates
function findMatchingTopic(searchTopic: string): string {
  const normalizedSearch = searchTopic.toLowerCase().trim()
  
  // Direct match
  const directMatch = Object.keys(topicTemplates).find(k => 
    k.toLowerCase() === normalizedSearch
  )
  if (directMatch) return directMatch
  
  // Partial match
  const partialMatch = Object.keys(topicTemplates).find(k => 
    k.toLowerCase().includes(normalizedSearch) || 
    normalizedSearch.includes(k.toLowerCase())
  )
  if (partialMatch) return partialMatch
  
  // Keyword mapping for common variations
  const keywordMap: Record<string, string> = {
    'coding': 'Programming',
    'code': 'Programming',
    'javascript': 'Programming',
    'python': 'Programming',
    'java': 'Programming',
    'web': 'Programming',
    'software': 'Programming',
    'algorithm': 'Computer Science',
    'data structure': 'Computer Science',
    'network': 'Computer Science',
    'database': 'Computer Science',
    'math': 'Mathematics',
    'calculus': 'Mathematics',
    'algebra': 'Mathematics',
    'geometry': 'Mathematics',
    'statistics': 'Mathematics',
    'bio': 'Biology',
    'genetics': 'Biology',
    'anatomy': 'Biology',
    'ecology': 'Biology',
    'chem': 'Chemistry',
    'organic': 'Chemistry',
    'inorganic': 'Chemistry',
    'phys': 'Physics',
    'mechanics': 'Physics',
    'electricity': 'Physics',
    'quantum': 'Physics',
    'thermodynamics': 'Physics',
    'history': 'General Knowledge',
    'geography': 'General Knowledge',
    'current affairs': 'General Knowledge',
    'gk': 'General Knowledge',
  }
  
  for (const [keyword, mappedTopic] of Object.entries(keywordMap)) {
    if (normalizedSearch.includes(keyword)) {
      return mappedTopic
    }
  }
  
  return 'General Knowledge'
}

export function generateQuestions(
  topic: string,
  subtopic: string,
  difficulty: 'Easy' | 'Medium' | 'Hard',
  count: number,
  includeExplanation: boolean
): AIGeneratedQuestion[] {
  const questions: AIGeneratedQuestion[] = []
  
  // Find the best matching topic
  const topicKey = findMatchingTopic(topic)
  const topicData = topicTemplates[topicKey] || topicTemplates['General Knowledge']
  
  // Get questions for the specified difficulty
  const difficultyKey = difficulty.toLowerCase() as 'easy' | 'medium' | 'hard'
  const difficultyQuestions = topicData[difficultyKey] || topicData.medium
  
  // Also get some questions from adjacent difficulties for variety
  const allQuestions = [
    ...difficultyQuestions,
    ...(difficulty === 'Medium' ? [...topicData.easy.slice(0, 2), ...topicData.hard.slice(0, 2)] : []),
    ...(difficulty === 'Easy' ? topicData.medium.slice(0, 2) : []),
    ...(difficulty === 'Hard' ? topicData.medium.slice(0, 2) : []),
  ]
  
  const shuffledTemplates = shuffleArray([...new Set(allQuestions)])
  
  for (let i = 0; i < count; i++) {
    const template = shuffledTemplates[i % shuffledTemplates.length]
    
    // Shuffle the options but keep track of the correct answer
    const optionsWithIndex = template.options.map((opt, idx) => ({ opt, isCorrect: idx === template.correct }))
    const shuffledOptions = shuffleArray(optionsWithIndex)
    const newCorrectIndex = shuffledOptions.findIndex(o => o.isCorrect)
    
    questions.push({
      id: generateId(),
      text: template.text,
      options: shuffledOptions.map(o => o.opt),
      correctAnswer: newCorrectIndex,
      topic: topic || topicKey,
      subtopic: subtopic || topic || topicKey,
      difficulty,
      explanation: includeExplanation ? template.explanation : '',
      generatedAt: new Date().toISOString(),
      savedToExam: false,
    })
  }
  
  return questions
}

export function analyzeResults(results: Array<{ correct: number; wrong: number; topic?: string; violations: number }>): {
  weakTopics: string[]
  difficultQuestions: number
  lowAccuracyAreas: string[]
  highViolationTrend: boolean
  suspiciousBehaviorSummary: string
} {
  const totalCorrect = results.reduce((sum, r) => sum + r.correct, 0)
  const totalWrong = results.reduce((sum, r) => sum + r.wrong, 0)
  const totalViolations = results.reduce((sum, r) => sum + r.violations, 0)
  const accuracy = totalCorrect / (totalCorrect + totalWrong) || 0
  
  return {
    weakTopics: accuracy < 0.5 ? ['General concepts', 'Application problems'] : [],
    difficultQuestions: Math.round(totalWrong * 0.3),
    lowAccuracyAreas: accuracy < 0.6 ? ['Conceptual understanding', 'Problem solving'] : [],
    highViolationTrend: totalViolations > results.length * 2,
    suspiciousBehaviorSummary: totalViolations > results.length * 3 
      ? 'High violation count detected across multiple sessions'
      : 'Normal behavior patterns observed',
  }
}
