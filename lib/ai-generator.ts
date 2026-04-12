import type { AIGeneratedQuestion } from './types'

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36)

// Question templates by topic
const topicTemplates: Record<string, { questions: Array<{ text: string; options: string[]; correct: number; explanation: string }> }> = {
  'Programming': {
    questions: [
      { text: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n^2)', 'O(1)'], correct: 1, explanation: 'Binary search divides the search space in half each time, resulting in O(log n) complexity.' },
      { text: 'Which data structure uses LIFO principle?', options: ['Queue', 'Stack', 'Array', 'Linked List'], correct: 1, explanation: 'Stack follows Last In First Out (LIFO) principle where the last element added is the first to be removed.' },
      { text: 'What does HTML stand for?', options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Hyper Transfer Markup Language', 'Home Tool Markup Language'], correct: 0, explanation: 'HTML stands for Hyper Text Markup Language, used for creating web pages.' },
      { text: 'Which keyword is used to declare a constant in JavaScript?', options: ['var', 'let', 'const', 'static'], correct: 2, explanation: 'The const keyword declares a block-scoped constant that cannot be reassigned.' },
      { text: 'What is the output of 2 + "2" in JavaScript?', options: ['4', '22', 'Error', 'undefined'], correct: 1, explanation: 'JavaScript converts the number to string and concatenates, resulting in "22".' },
    ]
  },
  'Mathematics': {
    questions: [
      { text: 'What is the derivative of x^2?', options: ['x', '2x', '2', 'x^2'], correct: 1, explanation: 'Using the power rule, d/dx(x^n) = nx^(n-1), so d/dx(x^2) = 2x.' },
      { text: 'What is the value of sin(90°)?', options: ['0', '1', '-1', '0.5'], correct: 1, explanation: 'The sine of 90 degrees equals 1, which is the maximum value of the sine function.' },
      { text: 'What is 15% of 200?', options: ['15', '30', '25', '35'], correct: 1, explanation: '15% of 200 = (15/100) × 200 = 30.' },
      { text: 'If a triangle has angles 60°, 60°, and 60°, what type is it?', options: ['Isosceles', 'Scalene', 'Equilateral', 'Right'], correct: 2, explanation: 'A triangle with all equal angles (60° each) is an equilateral triangle.' },
      { text: 'What is the sum of interior angles of a pentagon?', options: ['360°', '540°', '720°', '180°'], correct: 1, explanation: 'Sum of interior angles = (n-2) × 180° = (5-2) × 180° = 540°.' },
    ]
  },
  'Science': {
    questions: [
      { text: 'What is the chemical symbol for gold?', options: ['Go', 'Gd', 'Au', 'Ag'], correct: 2, explanation: 'Gold symbol Au comes from Latin "aurum" meaning gold.' },
      { text: 'What is the powerhouse of the cell?', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi body'], correct: 1, explanation: 'Mitochondria produce ATP through cellular respiration, providing energy for the cell.' },
      { text: 'What planet is known as the Red Planet?', options: ['Venus', 'Jupiter', 'Mars', 'Saturn'], correct: 2, explanation: 'Mars appears red due to iron oxide (rust) on its surface.' },
      { text: 'What is the speed of light in vacuum?', options: ['3×10^6 m/s', '3×10^8 m/s', '3×10^10 m/s', '3×10^5 m/s'], correct: 1, explanation: 'The speed of light in vacuum is approximately 3×10^8 meters per second.' },
      { text: 'Which gas do plants absorb from the atmosphere?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], correct: 2, explanation: 'Plants absorb carbon dioxide during photosynthesis to produce glucose and oxygen.' },
    ]
  },
  'General Knowledge': {
    questions: [
      { text: 'Which is the largest ocean on Earth?', options: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], correct: 2, explanation: 'The Pacific Ocean is the largest, covering about 63 million square miles.' },
      { text: 'Who wrote "Romeo and Juliet"?', options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'], correct: 1, explanation: 'William Shakespeare wrote Romeo and Juliet around 1594-1596.' },
      { text: 'What is the capital of Australia?', options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], correct: 2, explanation: 'Canberra is the capital city of Australia, not Sydney or Melbourne.' },
      { text: 'How many continents are there on Earth?', options: ['5', '6', '7', '8'], correct: 2, explanation: 'There are 7 continents: Africa, Antarctica, Asia, Australia, Europe, North America, and South America.' },
      { text: 'What year did World War II end?', options: ['1943', '1944', '1945', '1946'], correct: 2, explanation: 'World War II ended in 1945 with the surrender of Japan in September.' },
    ]
  },
  'Physics': {
    questions: [
      { text: 'What is the SI unit of force?', options: ['Joule', 'Newton', 'Watt', 'Pascal'], correct: 1, explanation: 'Newton (N) is the SI unit of force, defined as kg⋅m/s².' },
      { text: 'What is Newton\'s first law also known as?', options: ['Law of Acceleration', 'Law of Inertia', 'Law of Action-Reaction', 'Law of Gravity'], correct: 1, explanation: 'Newton\'s first law is the Law of Inertia - an object at rest stays at rest unless acted upon by a force.' },
      { text: 'What is the formula for kinetic energy?', options: ['mv', '½mv²', 'mgh', 'ma'], correct: 1, explanation: 'Kinetic energy = ½mv², where m is mass and v is velocity.' },
      { text: 'Which color of visible light has the longest wavelength?', options: ['Violet', 'Blue', 'Green', 'Red'], correct: 3, explanation: 'Red light has the longest wavelength (~700nm) in the visible spectrum.' },
      { text: 'What is absolute zero in Celsius?', options: ['-273.15°C', '-100°C', '0°C', '-459.67°C'], correct: 0, explanation: 'Absolute zero is -273.15°C or 0 Kelvin, the lowest possible temperature.' },
    ]
  },
  'Chemistry': {
    questions: [
      { text: 'What is the pH of pure water?', options: ['0', '7', '14', '1'], correct: 1, explanation: 'Pure water has a neutral pH of 7, neither acidic nor basic.' },
      { text: 'How many electrons can the first electron shell hold?', options: ['2', '8', '18', '32'], correct: 0, explanation: 'The first electron shell (K shell) can hold a maximum of 2 electrons.' },
      { text: 'What is the most abundant gas in Earth\'s atmosphere?', options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Argon'], correct: 2, explanation: 'Nitrogen makes up about 78% of Earth\'s atmosphere.' },
      { text: 'What type of bond involves sharing of electrons?', options: ['Ionic', 'Covalent', 'Metallic', 'Hydrogen'], correct: 1, explanation: 'Covalent bonds are formed when atoms share electron pairs.' },
      { text: 'What is the atomic number of Carbon?', options: ['4', '6', '8', '12'], correct: 1, explanation: 'Carbon has atomic number 6, meaning it has 6 protons in its nucleus.' },
    ]
  },
  'Biology': {
    questions: [
      { text: 'What is the basic unit of life?', options: ['Atom', 'Molecule', 'Cell', 'Tissue'], correct: 2, explanation: 'The cell is the basic structural and functional unit of all living organisms.' },
      { text: 'Which organelle contains genetic material?', options: ['Ribosome', 'Nucleus', 'Lysosome', 'Vacuole'], correct: 1, explanation: 'The nucleus contains DNA, the genetic material that controls cell activities.' },
      { text: 'What is the process by which plants make food?', options: ['Respiration', 'Photosynthesis', 'Digestion', 'Fermentation'], correct: 1, explanation: 'Photosynthesis is the process where plants use sunlight to convert CO2 and water into glucose.' },
      { text: 'How many chromosomes do humans have?', options: ['23', '46', '44', '48'], correct: 1, explanation: 'Humans have 46 chromosomes (23 pairs) in most body cells.' },
      { text: 'What type of blood cells fight infection?', options: ['Red blood cells', 'White blood cells', 'Platelets', 'Plasma'], correct: 1, explanation: 'White blood cells (leukocytes) are part of the immune system and fight infections.' },
    ]
  },
  'Computer Science': {
    questions: [
      { text: 'What does CPU stand for?', options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Computer Processing Unit'], correct: 0, explanation: 'CPU stands for Central Processing Unit, the brain of the computer.' },
      { text: 'What is 1024 bytes equal to?', options: ['1 Megabyte', '1 Kilobyte', '1 Gigabyte', '1 Bit'], correct: 1, explanation: '1024 bytes = 1 Kilobyte (KB) in binary notation.' },
      { text: 'Which protocol is used for secure web browsing?', options: ['HTTP', 'FTP', 'HTTPS', 'SMTP'], correct: 2, explanation: 'HTTPS (HTTP Secure) uses SSL/TLS encryption for secure communication.' },
      { text: 'What is the binary representation of decimal 10?', options: ['1010', '1100', '1001', '1011'], correct: 0, explanation: '10 in decimal = 1010 in binary (8+0+2+0 = 10).' },
      { text: 'Which sorting algorithm has the best average time complexity?', options: ['Bubble Sort', 'Selection Sort', 'Quick Sort', 'Insertion Sort'], correct: 2, explanation: 'Quick Sort has O(n log n) average time complexity, better than O(n²) of others.' },
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

export function generateQuestions(
  topic: string,
  subtopic: string,
  difficulty: 'Easy' | 'Medium' | 'Hard',
  count: number,
  includeExplanation: boolean
): AIGeneratedQuestion[] {
  const questions: AIGeneratedQuestion[] = []
  
  // Find matching topic or use general knowledge
  const topicKey = Object.keys(topicTemplates).find(k => 
    k.toLowerCase().includes(topic.toLowerCase()) || 
    topic.toLowerCase().includes(k.toLowerCase())
  ) || 'General Knowledge'
  
  const templates = topicTemplates[topicKey]?.questions || topicTemplates['General Knowledge'].questions
  const shuffledTemplates = shuffleArray([...templates])
  
  for (let i = 0; i < count; i++) {
    const template = shuffledTemplates[i % shuffledTemplates.length]
    const variation = i >= shuffledTemplates.length ? ` (Variation ${Math.floor(i / shuffledTemplates.length) + 1})` : ''
    
    questions.push({
      id: generateId(),
      text: template.text + variation,
      options: [...template.options],
      correctAnswer: template.correct,
      topic,
      subtopic: subtopic || topic,
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
