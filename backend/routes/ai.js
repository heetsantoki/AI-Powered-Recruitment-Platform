const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('✦ Gemini AI Engine initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize Gemini AI client:', err);
  }
}

// Helper: Dynamically request content with retries and fallback models on 503/429 spikes
async function generateGeminiContentWithFallback(prompt, generationConfig = null) {
  const models = [
    'gemini-3.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-2.5-flash',
    'gemini-2.0-flash'
  ];
  let lastError = null;
  const maxRetries = 2; // Number of retries per model

  for (const modelName of models) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🤖 Attempting Gemini content generation via ${modelName} (Attempt ${attempt + 1}/${maxRetries + 1})...`);
        const model = genAI.getGenerativeModel({ model: modelName, generationConfig });
        const response = await model.generateContent(prompt);
        const text = response.response.text().trim();
        console.log(`✅ Content generation succeeded using model: ${modelName} on attempt ${attempt + 1}`);
        return text;
      } catch (err) {
        lastError = err;
        const isTransient = err.status === 503 || err.message?.includes('503') || err.message?.includes('high demand') || err.message?.includes('ResourceExhausted');
        const isQuotaExceeded = err.status === 429 || err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('Quota');

        if (isTransient && !isQuotaExceeded && attempt < maxRetries) {
          console.warn(`⚠️ Model "${modelName}" busy (503/high demand). Waiting 2 seconds before retry...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue; // Try the next attempt for the same model
        }
        
        console.warn(`⚠️ Model "${modelName}" failed permanently or exhausted all retries. Error:`, err.message || err);
        break; // Break the attempt loop to move to the next fallback model in the list
      }
    }
  }

  throw lastError || new Error('All Gemini fallback models and retries failed.');
}

// ─── AI Engine (Rule-based NLP simulation) ─────────────────────────────────

const SKILL_KEYWORDS = {
  'React.js': ['react', 'jsx', 'hooks', 'redux', 'frontend'],
  'Node.js': ['node', 'nodejs', 'express', 'backend', 'server'],
  'Python': ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy', 'ml', 'machine learning'],
  'TypeScript': ['typescript', 'ts', 'type'],
  'JavaScript': ['javascript', 'js', 'es6', 'es2015', 'vanilla'],
  'MongoDB': ['mongodb', 'mongo', 'nosql', 'mongoose'],
  'PostgreSQL': ['postgres', 'postgresql', 'relational', 'sql'],
  'Docker': ['docker', 'container', 'containeriz', 'devops'],
  'AWS': ['aws', 'amazon', 'cloud', 's3', 'ec2', 'lambda'],
  'GraphQL': ['graphql', 'apollo', 'queries', 'mutations'],
  'Git': ['git', 'github', 'version control'],
  'REST APIs': ['api', 'rest', 'restful', 'endpoint', 'http'],
  'Vue.js': ['vue', 'vuex', 'nuxt'],
  'Angular': ['angular', 'typescript', 'rxjs'],
  'Java': ['java', 'spring', 'springboot', 'maven', 'gradle'],
  'Kubernetes': ['kubernetes', 'k8s', 'orchestrat'],
  'Redis': ['redis', 'cache', 'caching'],
  'TensorFlow': ['tensorflow', 'keras', 'deep learning', 'neural'],
  'Figma': ['figma', 'design', 'wireframe', 'prototype', 'ui', 'ux'],
  'CSS/SCSS': ['css', 'scss', 'sass', 'tailwind', 'styled-components'],
  'Next.js': ['nextjs', 'next.js', 'ssr', 'server-side rendering'],
  'Flutter': ['flutter', 'dart', 'mobile', 'ios', 'android'],
  'PyTorch': ['pytorch', 'torch'],
  'Machine Learning': ['machine learning', 'ml', 'deep learning', 'neural'],
  'Data Modeling': ['data modeling', 'modeling', 'data pipeline', 'etl'],
  'Unity': ['unity', 'unity3d'],
  'C#': ['c#', 'csharp', 'dotnet', '.net'],
  'Unreal Engine': ['unreal', 'unreal engine', 'ue4', 'ue5'],
  'Blender': ['blender', '3d modeling'],
  'Selenium': ['selenium', 'webdriver', 'automation testing', 'test automation'],
  'Jest': ['jest', 'unit test', 'testing library', 'testing'],
  'Unit Testing': ['unit testing', 'unit test', 'testing', 'mocha', 'chai', 'jest'],
  'Kotlin': ['kotlin'],
  'Android Studio': ['android studio', 'android sdk', 'gradle'],
  'Swift': ['swift', 'swiftui'],
  'Objective-C': ['objective-c', 'objc'],
  'Xcode': ['xcode', 'ios sdk'],
  'Spark': ['spark', 'pyspark', 'apache spark'],
  'Hadoop': ['hadoop', 'mapreduce', 'hdfs'],
  'Linux': ['linux', 'bash', 'shell', 'ubuntu', 'debian', 'centos'],
  'Network Security': ['network security', 'firewall', 'vpn', 'ids', 'ips'],
  'Cryptography': ['cryptography', 'encryption', 'tls', 'ssl', 'ssh'],
  'Terraform': ['terraform', 'iac', 'infrastructure as code'],
  'Agile Methodology': ['agile', 'scrum', 'kanban', 'jira'],
  'Product Strategy': ['product strategy', 'roadmap', 'market research', 'product launch'],
  'Project Management': ['project management', 'milestones', 'timeline', 'planning'],
  'Technical Documentation': ['documentation', 'api docs', 'technical writing', 'markdown', 'readme'],
  'HTML5': ['html5', 'html', 'semantic markup', 'xhtml'],
  'CSS3': ['css3', 'css', 'flexbox', 'css grid', 'responsive css'],
  'SASS': ['sass', 'css preprocessor'],
  'SCSS': ['scss', 'css preprocessor'],
  'Tailwind CSS': ['tailwind', 'tailwindcss'],
  'Redux': ['redux', 'redux-toolkit', 'rtk', 'state management'],
  'Redux Toolkit': ['redux-toolkit', 'rtk', 'state management'],
  'Webpack': ['webpack', 'module bundler'],
  'Vite': ['vite', 'vitejs'],
  'Responsive Design': ['responsive design', 'media queries', 'mobile responsive', 'responsive layouts'],
  'Web Accessibility': ['accessibility', 'a11y', 'aria', 'wcag'],
  'SEO': ['seo', 'search engine optimization', 'metadata', 'structured data'],
  'Cypress': ['cypress', 'cypress.io'],
  'Playwright': ['playwright'],
  'Storybook': ['storybook'],
  'Lighthouse': ['lighthouse'],
  'Web Performance': ['browser performance', 'optimization', 'page speed'],
  'Browser DevTools': ['chrome devtools', 'debugging', 'browser tools'],
  'SSR': ['server side rendering', 'ssr'],
  'SSG': ['static site generation', 'ssg'],
  'DOM Manipulation': ['dom', 'document object model'],
  'ES6+': ['es6', 'es7', 'es8', 'modern javascript'],
  'LocalStorage': ['localstorage', 'sessionstorage', 'web storage'],
  'IndexedDB': ['indexeddb'],
  'Express.js': ['express', 'expressjs'],
  'Django': ['django'],
  'FastAPI': ['fastapi'],
  'Spring Boot': ['spring boot', 'springboot'],
  'MySQL': ['mysql', 'relational db'],
  'JWT': ['jwt', 'json web token'],
  'OAuth 2.0': ['oauth', 'oauth2', 'authentication'],
  'RabbitMQ': ['rabbitmq', 'message queue'],
  'Apache Kafka': ['kafka', 'apache kafka'],
  'API Security': ['cors', 'xss', 'csrf', 'rate limiting', 'helmet', 'api security'],
  'CI/CD': ['ci/cd', 'continuous integration', 'continuous delivery'],
  'SQL Optimization': ['query optimization', 'indexing', 'sql query plan'],
  'Database Indexing': ['index', 'indexes', 'database indexing'],
  'Database Migration': ['migration', 'migrations', 'database migration'],
  'Event-Driven Architecture': ['event-driven', 'pub/sub', 'pub-sub'],
  'R Language': ['r language', 'r programming', 'r script'],
  'Pandas': ['pandas', 'dataframe'],
  'NumPy': ['numpy'],
  'SciPy': ['scipy'],
  'Scikit-Learn': ['scikit-learn', 'sklearn'],
  'Data Visualization (Matplotlib/Seaborn)': ['matplotlib', 'seaborn', 'data visualization', 'charting', 'plotting'],
  'Tableau': ['tableau', 'bi tool', 'business intelligence'],
  'NLP': ['nlp', 'natural language processing', 'spacy', 'nltk'],
  'Apache Spark': ['spark', 'apache spark', 'pyspark'],
  'Statistical Analysis': ['statistics', 'statistical analysis', 'hypothesis testing'],
  'Jupyter Notebooks': ['jupyter', 'jupyter notebook', 'ipynb'],
  'Data Wrangling': ['data wrangling', 'data cleaning', 'data cleaning techniques'],
  'BI Tools': ['business intelligence', 'power bi', 'tableau'],
  'Power BI': ['power bi', 'powerbi'],
  'XGBoost': ['xgboost'],
  'Random Forest': ['random forest'],
  'Deep Learning': ['deep learning', 'neural networks', 'ann', 'cnn', 'rnn'],
  'Keras': ['keras'],
  'Computer Vision': ['computer vision', 'opencv', 'image processing'],
  'MLOps': ['mlops', 'model deployment', 'ml pipelines'],
  'MLflow': ['mlflow'],
  'GCP': ['gcp', 'google cloud', 'google cloud platform'],
  'Azure': ['azure', 'microsoft azure'],
  'GitHub Actions': ['github actions', 'gh actions'],
  'Ansible': ['ansible'],
  'Nginx': ['nginx', 'reverse proxy'],
  'Prometheus': ['prometheus'],
  'Grafana': ['grafana'],
  'ELK Stack': ['elk', 'elasticsearch', 'logstash', 'kibana'],
  'IaC': ['iac', 'infrastructure as code', 'terraform'],
  'CloudFormation': ['cloudformation', 'aws cloudformation'],
  'Gitlab CI': ['gitlab ci', 'gitlab-ci'],
  'Helm': ['helm', 'helm charts'],
  'ArgoCD': ['argocd'],
  'AWS IAM': ['iam', 'aws iam', 'access management'],
  'CloudWatch': ['cloudwatch', 'aws cloudwatch'],
  'VPN': ['vpn', 'virtual private network'],
  'Load Balancing': ['load balancer', 'load balancing', 'elb', 'alb'],
  'Auto Scaling': ['auto scaling', 'autoscaling'],
  'Kubernetes Ingress': ['ingress', 'kubernetes ingress'],
  'Service Mesh': ['service mesh', 'istio'],
  'Secrets Management': ['secrets', 'vault', 'secrets manager'],
  'Vault': ['hashicorp vault', 'vault'],
  'Datadog': ['datadog'],
  'Sketch': ['sketchapp', 'sketch design'],
  'Wireframing': ['wireframing', 'wireframe', 'wireframes'],
  'Prototyping': ['prototyping', 'prototype', 'prototypes'],
  'User Research': ['user research', 'user interviews', 'surveys'],
  'User Journey Mapping': ['journey mapping', 'user journey', 'journey map'],
  'Information Architecture': ['information architecture', 'site map', 'sitemap'],
  'Interaction Design': ['interaction design', 'ixd'],
  'Visual Design': ['visual design', 'graphic design', 'aesthetics'],
  'Design Systems': ['design system', 'design systems', 'pattern library'],
  'Usability Testing': ['usability testing', 'user testing', 'testing layouts'],
  'Mobile-First Design': ['mobile-first', 'mobile first'],
  'UI Components': ['ui components', 'ui library', 'design components'],
  'React Native': ['react native', 'reactnative'],
  'Mobile Database (SQLite/Realm)': ['sqlite', 'realm', 'local database', 'mobile db'],
  'FCM': ['fcm', 'firebase cloud messaging'],
  'APNS': ['apns', 'apple push notification'],
  'Google Maps API': ['google maps', 'maps api'],
  'Location Services': ['core location', 'gps', 'location services'],
  'App Store Connect': ['app store connect', 'iTunes connect'],
  'TestFlight': ['testflight'],
  'Appium': ['appium'],
  'JMeter': ['jmeter', 'apache jmeter'],
  'Bug Tracking (Jira)': ['jira', 'bug tracking', 'issue tracking', 'redmine'],
  'Regression Testing': ['regression testing', 'regression test'],
  'Test Cases': ['test cases', 'test case', 'test suite'],
  'Quality Assurance': ['quality assurance', 'qa', 'software quality'],
  'Jetpack Compose': ['jetpack compose', 'compose'],
  'Dagger Hilt': ['dagger', 'hilt', 'dependency injection', 'di'],
  'Coroutines': ['coroutines', 'kotlin coroutines', 'asynchronous'],
  'MVVM Architecture': ['mvvm', 'model-view-viewmodel'],
  'Firebase': ['firebase', 'firestore', 'realtime database'],
  'Android Jetpack': ['jetpack', 'android jetpack'],
  'ViewModel': ['viewmodel'],
  'Data Binding': ['data binding'],
  'View Binding': ['view binding'],
  'OkHttp': ['okhttp'],
  'ProGuard': ['proguard', 'r8'],
  'UIKit': ['uikit'],
  'CocoaPods': ['cocoapods', 'pods'],
  'CoreData': ['coredata', 'core data'],
  'Combine Framework': ['combine framework', 'combine'],
  'SPM': ['spm', 'swift package manager'],
  'Swift Package Manager': ['spm', 'swift package manager'],
  'SwiftLint': ['swiftlint'],
  'Apache Airflow': ['airflow', 'apache airflow'],
  'ETL Pipelines': ['etl', 'extract transform load', 'data pipeline', 'etl pipeline'],
  'Snowflake': ['snowflake', 'snowflake db'],
  'Redshift': ['redshift', 'amazon redshift'],
  'BigQuery': ['bigquery', 'google bigquery'],
  'Databricks': ['databricks'],
  'PySpark': ['pyspark'],
  'Cassandra': ['cassandra', 'apache cassandra'],
  'DynamoDB': ['dynamodb', 'amazon dynamodb'],
  'Data Warehousing': ['data warehousing', 'data warehouse'],
  'Data Lake': ['data lake', 'data lakes'],
  'Splunk': ['splunk'],
  'Vulnerability Assessment': ['vulnerability assessment', 'vulnerability scanning', 'nessus'],
  'Penetration Testing': ['penetration testing', 'pentesting', 'ethical hacking'],
  'Firewalls': ['firewall', 'firewalls', 'palo alto', 'fortinet'],
  'Wireshark': ['wireshark', 'packet capture', 'packet analysis'],
  'Threat Intelligence': ['threat intelligence', 'threat hunting', 'threat analysis'],
  'Incident Response': ['incident response', 'incident handling', 'forensics'],
  'Intrusion Detection (IDS/IPS)': ['ids', 'ips', 'snort', 'suricata'],
  'Security Compliance (GDPR/SOC2)': ['compliance', 'gdpr', 'soc2', 'hipaa', 'pci-dss'],
  'Active Directory': ['active directory', 'ad', 'domain controller'],
  'Cloud Security': ['cloud security', 'aws security', 'azure security'],
  'Serverless': ['serverless', 'lambda', 'cloud functions', 'fargate'],
  'Cloud Migration': ['cloud migration', 'migration to cloud'],
  'Cloud Cost Optimization': ['cost optimization', 'cloud cost'],
  'Containerization': ['containerization', 'containers', 'docker'],
  'Scrum': ['scrum', 'agile scrum'],
  'Kanban': ['kanban', 'agile kanban'],
  'Jira': ['jira', 'bug tracking', 'issue tracking', 'redmine'],
  'Product Roadmap': ['product roadmap', 'roadmap', 'product planning'],
  'User Stories': ['user stories', 'user story', 'epic', 'epics'],
  'Mixpanel': ['mixpanel'],
  'Amplitude': ['amplitude'],
  'Stakeholder Management': ['stakeholder management', 'stakeholders', 'client relations'],
  'KPI Definition': ['kpi', 'key performance indicators', 'okr', 'okrs', 'metrics'],
  'Competitor Analysis': ['competitor analysis', 'competitive analysis', 'market mapping'],
  'SDLC': ['sdlc', 'software development lifecycle', 'waterfall', 'agile sdlc'],
  'PRDs': ['prd', 'prds', 'product requirement document', 'specifications'],
  'C++': ['c++', 'cpp'],
  '3D Modeling': ['3d modeling', '3d assets', 'low poly', 'high poly'],
  'Game Physics': ['physics engine', 'game physics', 'gravity', 'collisions'],
  'Shader Programming': ['shader', 'shaders', 'hlsl', 'glsl', 'cg'],
  'Level Design': ['level design', 'world building', 'environment design'],
  'Game Loop Optimization': ['game loop', 'frame rate', 'optimization', 'performance optimization'],
  'AI Pathfinding': ['pathfinding', 'a*', 'navmesh', 'game ai'],
  'Animation Systems': ['animation system', 'mecanim', 'rigging', 'blend trees'],
  'Audio Engineering': ['audio engineering', 'fmod', 'wwise', 'sound design'],
  'Multiplayer Networking': ['networking', 'multiplayer', 'photon', 'mirror', 'netcode'],
  'Mobile Game Optimization': ['mobile game optimization', 'draw calls', 'batching'],
  'DirectX': ['directx', 'dx11', 'dx12'],
  'OpenGL': ['opengl', 'vulkan', 'webgl'],
  'Cocos2d': ['cocos2d', 'cocos'],
  'Game Design Patterns': ['game design patterns', 'state machine', 'object pool'],
};

const ROLE_SKILL_MAP = {
  'frontend developer': ['React.js', 'JavaScript', 'TypeScript', 'HTML5', 'CSS3', 'SASS', 'SCSS', 'Tailwind CSS', 'Next.js', 'Redux', 'Redux Toolkit', 'Vue.js', 'Angular', 'Webpack', 'Vite', 'Jest', 'Git', 'REST APIs', 'GraphQL', 'Responsive Design', 'Web Accessibility', 'SEO', 'Babel', 'ESLint', 'Prettier', 'Bootstrap', 'Material-UI', 'Ant Design', 'Chakra UI', 'Styled Components', 'CSS Modules', 'Flexbox', 'CSS Grid', 'HTML5 Canvas', 'SVG', 'Service Workers', 'PWA', 'WebSockets', 'Axios', 'Fetch API', 'NPM', 'Yarn', 'pnpm', 'Jest', 'Cypress', 'Playwright', 'React Testing Library', 'Storybook', 'Lighthouse', 'Web Performance', 'Browser DevTools', 'SSR', 'SSG', 'DOM Manipulation', 'ES6+', 'Webpack Dev Server', 'LocalStorage', 'IndexedDB'],
  'backend developer': ['Node.js', 'Express.js', 'Python', 'Django', 'FastAPI', 'Java', 'Spring Boot', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Docker', 'REST APIs', 'GraphQL', 'gRPC', 'Microservices', 'JWT', 'OAuth 2.0', 'RabbitMQ', 'Apache Kafka', 'API Security', 'Git', 'Knex.js', 'Prisma', 'Mongoose', 'Sequelize', 'TypeORM', 'Firebase', 'AWS S3', 'AWS EC2', 'AWS Lambda', 'Serverless', 'Nginx', 'Linux', 'Bash Scripting', 'WebSockets', 'CORS', 'Rate Limiting', 'Winston Logging', 'Unit Testing', 'Mocha', 'Chai', 'Supertest', 'Postman', 'CI/CD', 'SQL Optimization', 'Database Indexing', 'Database Migration', 'Event-Driven Architecture', 'HTTP/HTTPS', 'GraphQL Playground'],
  'full stack developer': ['React.js', 'Node.js', 'JavaScript', 'TypeScript', 'HTML5', 'CSS3', 'Next.js', 'Express.js', 'MongoDB', 'PostgreSQL', 'Docker', 'Git', 'REST APIs', 'GraphQL', 'Tailwind CSS', 'Redux', 'AWS', 'CI/CD', 'System Design', 'Redis', 'Webpack', 'Vite', 'SASS', 'SCSS', 'Bootstrap', 'Material-UI', 'NPM', 'Yarn', 'Axios', 'Fetch API', 'Mongoose', 'Sequelize', 'JWT', 'OAuth 2.0', 'API Security', 'Linux', 'Bash Scripting', 'WebSockets', 'Jest', 'Cypress', 'Storybook', 'Nginx', 'PM2', 'Serverless', 'SQL Optimization', 'Database Migration', 'Responsive Design', 'Web Performance', 'PWA', 'CORS', 'Lighthouse'],
  'data scientist': ['Python', 'R Language', 'SQL', 'Pandas', 'NumPy', 'SciPy', 'Scikit-Learn', 'TensorFlow', 'PyTorch', 'Matplotlib', 'Seaborn', 'Tableau', 'Machine Learning', 'Deep Learning', 'NLP', 'Apache Spark', 'Hadoop', 'Statistical Analysis', 'Jupyter Notebooks', 'Git', 'REST APIs', 'Data Modeling', 'Feature Engineering', 'Linear Regression', 'Logistic Regression', 'Decision Trees', 'Random Forest', 'XGBoost', 'K-Means Clustering', 'PCA', 'Neural Networks', 'A/B Testing', 'Hypothesis Testing', 'SQL Queries', 'Excel', 'Data Cleaning', 'Data Imputation', 'Predictive Modeling', 'Time Series Analysis', 'ARIMA', 'Web Scraping', 'BeautifulSoup', 'Scrapy', 'Google Colab', 'Model Deployment', 'Flask', 'Docker', 'Data Wrangling', 'BI Tools', 'Power BI', 'Statistics'],
  'machine learning engineer': ['Python', 'C++', 'TensorFlow', 'PyTorch', 'Scikit-Learn', 'Keras', 'Machine Learning', 'Deep Learning', 'Computer Vision', 'NLP', 'MLOps', 'MLflow', 'Docker', 'Kubernetes', 'AWS', 'Git', 'REST APIs', 'Data Modeling', 'Feature Engineering', 'SQL', 'XGBoost', 'Random Forest', 'CNN', 'RNN', 'LSTM', 'Transformers', 'BERT', 'OpenCV', 'Model Optimization', 'Hyperparameter Tuning', 'TensorBoard', 'Kubeflow', 'Model Serving', 'Triton', 'DVC', 'AWS SageMaker', 'GCP Vertex AI', 'Data Pipelines', 'ETL', 'CUDA', 'GPU Acceleration', 'Vector Databases', 'Pinecone', 'Milvus', 'Hugging Face', 'NumPy', 'Pandas', 'Scipy', 'ONNX', 'Model Quantization', 'Reinforcement Learning'],
  'devops engineer': ['Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Terraform', 'Ansible', 'Git', 'CI/CD', 'GitHub Actions', 'Jenkins', 'Linux', 'Bash Scripting', 'Python', 'Nginx', 'Prometheus', 'Grafana', 'ELK Stack', 'Network Security', 'IaC', 'CloudFormation', 'Gitlab CI', 'Bitbucket Pipelines', 'Helm', 'ArgoCD', 'Terraform Cloud', 'Bash', 'PowerShell', 'Apache', 'HAProxy', 'SSL/TLS', 'DNS', 'VPC', 'Load Balancing', 'Auto Scaling', 'AWS IAM', 'CloudWatch', 'AWS S3', 'AWS EC2', 'AWS RDS', 'Kubernetes Ingress', 'Service Mesh', 'Istio', 'Shell Scripting', 'Secrets Management', 'Vault', 'SonarQube', 'Container Registry', 'Docker Hub', 'ECR', 'GCR', 'Datadog'],
  'ui/ux designer': ['Figma', 'Adobe XD', 'Sketch', 'Wireframing', 'Prototyping', 'User Research', 'User Journey Mapping', 'Information Architecture', 'Interaction Design', 'Visual Design', 'Design Systems', 'Usability Testing', 'HTML5', 'CSS3', 'SASS', 'SCSS', 'Tailwind CSS', 'JavaScript', 'Responsive Design', 'Mobile-First Design', 'UI Components', 'Typography', 'Color Theory', 'Layout Grid', 'Iconography', 'Mood Boards', 'User Personas', 'Empathy Mapping', 'Site Mapping', 'High-Fidelity Mockups', 'Low-Fidelity Wireframes', 'Interactive Prototypes', 'Adobe Photoshop', 'Adobe Illustrator', 'Zeplin', 'InVision', 'UI Animations', 'Micro-interactions', 'Accessibility', 'WCAG', 'Heuristic Evaluation', 'User Flows', 'Task Analysis', 'Card Sorting', 'A/B Testing UX', 'Design Thinking', 'Collaborative Workshops', 'Design Handover', 'Design Tokens', 'Style Guides'],
  'mobile developer': ['Flutter', 'React Native', 'Swift', 'SwiftUI', 'Kotlin', 'Java', 'Objective-C', 'Android Studio', 'Xcode', 'Git', 'REST APIs', 'GraphQL', 'SQLite', 'Realm', 'Push Notifications', 'App Store Publishing', 'Google Play Console', 'Mobile UI/UX', 'State Management', 'Dart', 'Fastlane', 'Firebase', 'CocoaPods', 'SPM', 'Gradle', 'Android SDK', 'UIKit', 'CoreData', 'Combine Framework', 'Jetpack Compose', 'Retrofit', 'MVVM Architecture', 'FCM', 'APNS', 'Google Maps API', 'Location Services', 'App Store Connect', 'TestFlight', 'JUnit', 'Espresso', 'XCTest', 'Mobile Security', 'Keychain', 'SharedPreferences', 'Local Authentication', 'FaceID', 'TouchID', 'Deep Linking', 'App Performance Optimization', 'Memory Management'],
  'qa engineer': ['JavaScript', 'Python', 'Java', 'Selenium', 'Cypress', 'Playwright', 'Jest', 'JUnit', 'Unit Testing', 'Automation Testing', 'Manual Testing', 'API Testing', 'Postman', 'JMeter', 'Git', 'CI/CD', 'REST APIs', 'Jira', 'Regression Testing', 'Test Cases', 'Quality Assurance', 'Test Automation', 'Integration Testing', 'System Testing', 'Acceptance Testing', 'Smoke Testing', 'Sanity Testing', 'Ad-hoc Testing', 'Black Box Testing', 'White Box Testing', 'Performance Testing', 'Load Testing', 'Stress Testing', 'Security Testing', 'SQL Queries', 'Test Plans', 'Bug Lifecycle', 'Test Execution', 'Mobile Testing', 'Appium', 'Cross-Browser Compatibility', 'Test Reports', 'Confluence', 'TestRail', 'Zephyr', 'QA Methodologies', 'Agile Testing', 'Continuous Testing', 'Boundary Value Analysis', 'Equivalence Partitioning'],
  'android developer': ['Kotlin', 'Java', 'Android SDK', 'Android Studio', 'Jetpack Compose', 'Retrofit', 'Dagger Hilt', 'Coroutines', 'Git', 'REST APIs', 'SQLite', 'Room Database', 'MVVM Architecture', 'Google Play Services', 'Gradle', 'JUnit', 'Material Design', 'Push Notifications', 'Espresso', 'Firebase', 'Android Jetpack', 'LiveData', 'ViewModel', 'Data Binding', 'View Binding', 'WorkManager', 'Navigation Component', 'Flow', 'StateFlow', 'Kotlin Serialization', 'Gson', 'Jackson', 'OkHttp', 'ProGuard', 'R8', 'NDK', 'JNI', 'Google Maps SDK', 'Location Services', 'Firebase Crashlytics', 'Firebase Analytics', 'FCM', 'Multi-module Architecture', 'Clean Architecture', 'Dependency Injection', 'Unit Testing', 'Mockito', 'Mockk', 'Android Profiler', 'Memory Leak Detection', 'LeakCanary', 'Play Asset Delivery'],
  'ios developer': ['Swift', 'SwiftUI', 'UIKit', 'Xcode', 'CocoaPods', 'Objective-C', 'CoreData', 'Combine Framework', 'Git', 'REST APIs', 'MVC', 'MVVM', 'App Store Connect', 'TestFlight', 'XCTest', 'Push Notifications', 'Auto Layout', 'GCD', 'SPM', 'Fastlane', 'Cocoa Touch', 'Swift Package Manager', 'Core Animation', 'Core Graphics', 'Core Location', 'MapKit', 'WebKit', 'Local Authentication', 'Keychain', 'UserDefaults', 'URLSession', 'Alamofire', 'Codable', 'JSON Parsing', 'Memory Management', 'ARC', 'Instruments', 'Profiling', 'Clean Architecture', 'VIPER Architecture', 'Unit Testing', 'UI Testing', 'Storyboards', 'XIBs', 'Interface Builder', 'Apple Developer Portal', 'APNS', 'Firebase SDK', 'Cocoa Touch Class', 'SwiftLint'],
  'data engineer': ['Python', 'SQL', 'PostgreSQL', 'Spark', 'Hadoop', 'Git', 'REST APIs', 'Apache Airflow', 'ETL Pipelines', 'Snowflake', 'Redshift', 'BigQuery', 'AWS S3', 'NoSQL Databases', 'Kafka', 'Docker', 'Kubernetes', 'Linux', 'Data Modeling', 'Scala', 'dbt', 'Cloud Data Services', 'Databricks', 'PySpark', 'MapReduce', 'Hive', 'HDFS', 'HBase', 'Cassandra', 'DynamoDB', 'MongoDB', 'Data Warehousing', 'Data Lake', 'Apache Beam', 'Apache Flink', 'Apache NiFi', 'Data Catalog', 'Data Lineage', 'Schema Registry', 'Avro', 'Parquet', 'ORC', 'JDBC/ODBC', 'SQL Optimization', 'Database Indexing', 'Database Partitioning', 'Event Streaming', 'AWS Glue', 'Google Cloud Dataflow', 'Data Quality Testing'],
  'cybersecurity analyst': ['Linux', 'Network Security', 'Python', 'Git', 'Cryptography', 'Splunk', 'Vulnerability Assessment', 'Penetration Testing', 'Firewalls', 'Wireshark', 'IAM', 'Threat Intelligence', 'OWASP Top 10', 'Incident Response', 'Ethical Hacking', 'IDS', 'IPS', 'GDPR', 'SOC2', 'Active Directory', 'Cloud Security', 'Auditing', 'SIEM', 'Nessus', 'Nmap', 'Metasploit', 'Snort', 'Suricata', 'Incident Handling', 'Digital Forensics', 'Malware Analysis', 'Reverse Engineering', 'TCP/IP Protocols', 'Routing & Switching', 'VPN', 'SSL/TLS', 'Encryption Algorithms', 'Hash Functions', 'MFA', 'SSO', 'Zero Trust Architecture', 'Endpoint Protection', 'Antivirus', 'DLP', 'Threat Hunting', 'Kali Linux', 'Security Audits', 'Risk Assessment', 'HIPAA', 'ISO 27001'],
  'cloud engineer': ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Linux', 'Git', 'Terraform', 'CloudFormation', 'Serverless', 'CI/CD', 'Bash Scripting', 'Python', 'Cloud Security', 'Load Balancing', 'DNS Management', 'VPC', 'IAM', 'IaC', 'Microservices', 'AWS EC2', 'AWS S3', 'AWS RDS', 'AWS Lambda', 'Azure VMs', 'Azure Blob Storage', 'Azure SQL', 'Azure Functions', 'Google Compute Engine', 'Google Cloud Storage', 'Google Cloud SQL', 'Cloud Monitoring', 'Cloud Logging', 'CloudWatch', 'Stackdriver', 'Auto Scaling', 'CDN', 'Cloudflare', 'Route53', 'VPN Gateway', 'ExpressRoute', 'Direct Connect', 'Hybrid Cloud', 'Multi-Cloud', 'Cloud Migration', 'Cloud Cost Optimization', 'Containerization', 'Helm', 'Kubernetes Services', 'Ingress Controller'],
  'product manager': ['Agile Methodology', 'Figma', 'Product Strategy', 'Project Management', 'Technical Documentation', 'Scrum', 'Kanban', 'Jira', 'Product Roadmap', 'User Stories', 'Market Research', 'A/B Testing', 'Mixpanel', 'Amplitude', 'Stakeholder Management', 'SQL', 'KPI Definition', 'UX Fundamentals', 'Competitor Analysis', 'SDLC', 'Customer Feedback Loop', 'PRDs', 'Product Lifecycle', 'Product Launch', 'Go-To-Market Strategy', 'User Interviews', 'Customer Journey', 'Wireframing', 'Data Analytics', 'Google Analytics', 'Market Segmentation', 'Customer Personas', 'Feature Prioritization', 'RICE Scoring', 'MoSCoW Method', 'Product Growth', 'User Retention', 'Churn Analysis', 'Customer Acquisition', 'Pricing Strategy', 'Confluence', 'Trello', 'Product Marketing', 'Release Management', 'User Acceptance Testing', 'Competitive Intelligence', 'Business Case Writing', 'Value Proposition'],
  'game developer': ['Unity', 'C#', 'Unreal Engine', 'C++', 'Blender', 'Maya', '3D Modeling', 'Game Physics', 'Git', 'Shader Programming', 'Level Design', 'Game Loop Optimization', 'AI Pathfinding', 'Animation Systems', 'Audio Engineering', 'Multiplayer Networking', 'Mobile Game Optimization', 'DirectX', 'OpenGL', 'Cocos2d', 'Game Design Patterns', 'Vector Math', 'Collision Detection', 'Rigging', 'Texturing', 'Substance Painter', 'Photoshop', 'Particle Systems', 'Visual Effects', 'UI Canvas', 'Input System', 'FMOD', 'Wwise', 'Photon', 'Mirror', 'Netcode', 'C++ Smart Pointers', 'Memory Management', 'Vulkan', 'WebGL', 'Shader Graph', 'HLSL', 'GLSL', 'NavMesh', 'State Machines', 'Behavior Trees', 'Game Loop', 'Profiling', 'Frame Rate Optimization', 'Object Pooling'],
};

// Parse free-form experience text → structured object
function parseExperienceText(text) {
  const lower = text.toLowerCase();

  // Extract job titles
  const titlePatterns = [
    /(?:worked as|working as|position of|role of|joined as|hired as)\s+([a-z\s]+?)(?:\s+at|\s+in|\s+@|,|\.)/i,
    /(?:i am|i was|i'm)\s+(?:a|an)\s+([a-z\s]+?)(?:\s+at|\s+in|\s+@|,|\.)/i,
    /([a-z\s]+?)\s+(?:at|@)\s+/i,
  ];
  let jobTitle = 'Software Engineer';
  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match) {
      jobTitle = match[1].trim();
      // Clean up
      jobTitle = jobTitle.replace(/^(a|an|the)\s+/i, '');
      jobTitle = jobTitle.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      break;
    }
  }

  // Extract company
  const companyPatterns = [
    /(?:at|@|for|in|with)\s+([A-Z][a-zA-Z\s]+?)(?:\s+for|\s+from|\s+since|,|\.|\n|$)/,
    /(?:company|organization|firm|startup)\s*(?:called|named)?\s+([A-Z][a-zA-Z\s]+?)(?:\s+for|,|\.|\n|$)/i,
  ];
  let company = 'Company';
  for (const pattern of companyPatterns) {
    const match = text.match(pattern);
    if (match) {
      company = match[1].trim();
      break;
    }
  }

  // Extract duration
  const durationPatterns = [
    /for\s+(\d+)\s*(year|month)/i,
    /(\d{4})\s*[-–to]+\s*(\d{4}|present|now|current)/i,
  ];
  let startDate = '';
  let endDate = null;
  let isCurrent = false;

  for (const pattern of durationPatterns) {
    const match = text.match(pattern);
    if (match) {
      if (pattern === durationPatterns[0]) {
        const years = parseInt(match[1]);
        const currentYear = new Date().getFullYear();
        if (match[2].toLowerCase().includes('year')) {
          startDate = `${currentYear - years}-01`;
        } else {
          const months = years;
          const d = new Date();
          d.setMonth(d.getMonth() - months);
          startDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }
        endDate = null;
        isCurrent = true;
      } else {
        startDate = `${match[1]}-01`;
        const end = match[2].toLowerCase();
        if (['present', 'now', 'current'].includes(end)) {
          isCurrent = true;
          endDate = null;
        } else {
          endDate = `${match[2]}-12`;
        }
      }
      break;
    }
  }

  // Extract achievements/bullets
  const bullets = [];
  const lines = text.split(/[.!?\n]+/).map(l => l.trim()).filter(l => l.length > 20);
  const achievementKeywords = ['built', 'developed', 'created', 'improved', 'reduced', 'increased', 'led', 'managed', 'designed', 'implemented', 'launched', 'optimized', 'automated', 'collaborated', 'mentored'];

  for (const line of lines) {
    const lline = line.toLowerCase();
    if (achievementKeywords.some(k => lline.includes(k))) {
      let bullet = line.trim();
      if (!bullet.match(/^[A-Z]/)) {
        bullet = bullet.charAt(0).toUpperCase() + bullet.slice(1);
      }
      bullets.push(bullet);
      if (bullets.length >= 4) break;
    }
  }

  // Generate description
  const description = `${jobTitle} at ${company}. ${text.slice(0, 120).trim()}${text.length > 120 ? '...' : ''}`;

  return {
    job_title: jobTitle,
    company,
    location: lower.includes('remote') ? 'Remote' : lower.includes('bangalore') ? 'Bangalore, India' : lower.includes('mumbai') ? 'Mumbai, India' : 'India',
    start_date: startDate,
    end_date: endDate,
    is_current: isCurrent,
    description,
    bullets: bullets.length > 0 ? bullets : [
      `Contributed to key features and deliverables at ${company}`,
      'Collaborated with cross-functional teams to meet project deadlines',
      'Applied best practices in software development and code quality',
    ]
  };
}

// Suggest skills from text/role
function suggestSkills(text, role = '') {
  const lower = (text + ' ' + role).toLowerCase();
  const suggestions = [];
  for (const [skill, keywords] of Object.entries(SKILL_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) {
      suggestions.push(skill);
    }
  }
  // Also add role-based
  for (const [roleKey, skills] of Object.entries(ROLE_SKILL_MAP)) {
    if (lower.includes(roleKey)) {
      skills.forEach(s => { if (!suggestions.includes(s)) suggestions.push(s); });
    }
  }
  return [...new Set(suggestions)].slice(0, 12);
}

// Generate profile summary
function generateSummary(profile) {
  const { name, headline, location, experiences = [], skills = [], projects = [] } = profile;
  const skillNames = skills.slice(0, 5).map(s => s.name).join(', ');
  const expCount = experiences.length;
  const projCount = projects.length;
  const latestExp = experiences[0];

  let summary = `${name || 'I'} am a ${headline || 'technology professional'}`;
  if (location) summary += ` based in ${location}`;
  summary += '.';
  if (expCount > 0 && latestExp) {
    summary += ` Currently ${latestExp.is_current ? `working as ${latestExp.job_title} at ${latestExp.company}` : `experienced as ${latestExp.job_title}`}.`;
  }
  if (skillNames) {
    summary += ` Proficient in ${skillNames}.`;
  }
  if (projCount > 0) {
    summary += ` Have built ${projCount} notable project${projCount > 1 ? 's' : ''} showcasing hands-on expertise.`;
  }
  summary += ' Looking for opportunities to contribute to innovative teams and make a meaningful impact.';
  return summary;
}

// Recommend roles
function recommendRoles(skills = [], headline = '') {
  const skillNames = skills.map(s => s.name.toLowerCase());
  const headlineLower = headline.toLowerCase();
  const combined = skillNames.join(' ') + ' ' + headlineLower;

  const scores = {};
  for (const [role, roleSkills] of Object.entries(ROLE_SKILL_MAP)) {
    scores[role] = roleSkills.filter(s => combined.includes(s.toLowerCase())).length;
  }

  return Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([role]) => role.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
}

// ─── Routes ────────────────────────────────────────────────────────────────

// POST /api/ai/parse-experience
router.post('/parse-experience', auth, async (req, res) => {
  const { text, engine } = req.body;
  if (!text || text.trim().length < 10) {
    return res.status(400).json({ error: 'Provide at least 10 characters of experience text' });
  }

  if (engine === 'gemini' && genAI) {
    try {
      const prompt = `
You are an expert resume parsing AI. Parse the following free-form experience description into a structured JSON object.

Text: "${text}"

The JSON object MUST have the following structure:
{
  "job_title": "String (e.g. Senior Software Engineer)",
  "company": "String (e.g. Google)",
  "location": "String (e.g. Remote, Bangalore, India)",
  "start_date": "String in YYYY-MM format or empty",
  "end_date": "String in YYYY-MM format or null",
  "is_current": Boolean,
  "description": "String (a brief summary sentence describing the role)",
  "bullets": ["Array of 2-4 high-impact bullet points focusing on quantitative achievements and actions starting with strong action verbs. Do not use markdown syntax in the bullets."]
}
`;
      const responseText = await generateGeminiContentWithFallback(prompt, { responseMimeType: 'application/json' });
      const parsedData = JSON.parse(responseText);
      return res.json({ success: true, experience: parsedData, is_gemini: true });
    } catch (err) {
      console.error('Gemini parse-experience error, falling back to local engine:', err);
      const result = parseExperienceText(text);
      return res.json({ success: true, experience: result, is_gemini: false, fallback: true });
    }
  }

  // Local AI engine
  setTimeout(() => {
    const result = parseExperienceText(text);
    res.json({ success: true, experience: result, is_gemini: false });
  }, 800);
});

// POST /api/ai/suggest-skills
router.post('/suggest-skills', auth, async (req, res) => {
  const { text = '', role = '' } = req.body;

  if (!role || role.trim().length === 0) {
    return res.status(400).json({ error: 'Please enter a target role to get suggestions.' });
  }

  if (genAI) {
    try {
      const prompt = `
You are an expert technical interviewer. Based on the target role: "${role}" and current candidate context (existing skills): "${text}", suggest a comprehensive list of the 24 most relevant technical skills, tools, frameworks, and specialized concepts.
Provide a highly diverse, granular list matching the target role, covering libraries, build tools, design principles, testing suites, databases, and architectural concepts. 
For example:
- If Frontend Developer: suggest HTML, CSS, JavaScript, React, Tailwind CSS, Redux, TypeScript, Next.js, Responsive Design, Webpack, Jest, SASS, Git, REST APIs, Context API, CSS Grid, HTML5 Semantic Tags, Web Performance Optimization, etc.
- If Backend Developer: suggest Node.js, Express.js, MongoDB, PostgreSQL, REST API, Docker, JWT, Authentication, MySQL, Redis, GraphQL, MVC Architecture, Microservices, Jest (Testing), AWS S3, CI/CD pipelines, System Design, etc.

Return a JSON object with this exact structure:
{
  "suggestions": ["Skill 1", "Skill 2", "Skill 3", ...]
}
`;
      const responseText = await generateGeminiContentWithFallback(prompt, { responseMimeType: 'application/json' });
      const parsedData = JSON.parse(responseText);
      return res.json({ success: true, suggestions: parsedData.suggestions, is_gemini: true });
    } catch (err) {
      console.error('Gemini suggest-skills error:', err);
      return res.status(500).json({ error: 'Gemini AI failed to generate skill suggestions. Check API connection.' });
    }
  }

  return res.status(403).json({ error: 'Gemini AI is not configured. Please add GEMINI_API_KEY to your .env file.' });
});

// POST /api/ai/generate-summary
router.post('/generate-summary', auth, async (req, res) => {
  const { profile } = req.body;
  const { name, headline, location, summaryInput, headlineInput } = profile || {};

  if (genAI) {
    try {
      let prompt = '';
      if (summaryInput && summaryInput.trim().length > 0) {
        prompt = `
You are an expert resume writer. Based on the raw, draft professional summary written by the candidate: "${summaryInput}", write a polished, professional, and compelling profile summary (3-4 sentences). 
Improve the grammar, vocabulary, and sentence structure, while retaining the core skills and experiences mentioned.
Candidate Name: ${name || 'the candidate'}
Location: ${location || ''}
Professional Headline: ${headline || ''}
Keep the output highly professional. Do not use placeholders or markdown.
`;
      } else {
        prompt = `
You are an expert resume writer. Based on the candidate's professional headline: "${headlineInput || headline}", write a highly professional, compelling, and engaging profile summary (3-4 sentences) that highlights their expertise, target role, and potential impact.
Candidate Name: ${name || 'the candidate'}
Location: ${location || ''}
Keep the output highly professional. Do not use placeholders or markdown.
`;
      }
      
      const summaryText = await generateGeminiContentWithFallback(prompt);
      return res.json({ success: true, summary: summaryText, is_gemini: true });
    } catch (err) {
      console.error('Gemini generate-summary error, falling back to local engine:', err);
      const summary = generateSummary(profile);
      return res.json({ success: true, summary, is_gemini: false, fallback: true });
    }
  }

  const summary = generateSummary(profile);
  res.json({ success: true, summary, is_gemini: false, fallback: true });
});

// POST /api/ai/recommend-roles
router.post('/recommend-roles', auth, async (req, res) => {
  const { skills = [], headline = '', engine } = req.body;

  if (engine === 'gemini' && genAI) {
    try {
      const prompt = `
You are a senior career advisor. Based on the candidate's skills: ${JSON.stringify(skills)} and professional headline: "${headline}", recommend up to 4 exact job roles/titles that represent high-match career paths.

Return a JSON object with this exact structure:
{
  "roles": ["Role 1", "Role 2", "Role 3", "Role 4"]
}
`;
      const responseText = await generateGeminiContentWithFallback(prompt, { responseMimeType: 'application/json' });
      const parsedData = JSON.parse(responseText);
      return res.json({ success: true, roles: parsedData.roles, is_gemini: true });
    } catch (err) {
      console.error('Gemini recommend-roles error, falling back to local engine:', err);
      const roles = recommendRoles(skills, headline);
      return res.json({ success: true, roles, is_gemini: false, fallback: true });
    }
  }

  setTimeout(() => {
    const roles = recommendRoles(skills, headline);
    res.json({ success: true, roles, is_gemini: false });
  }, 400);
});

const COMMON_TYPOS = [
  { pattern: /\bjava\s+script\b/i, error: 'java script', correction: 'JavaScript', type: 'technical_term' },
  { pattern: /\bjavascipt\b/i, error: 'javascipt', correction: 'JavaScript', type: 'technical_term' },
  { pattern: /\bjavasript\b/i, error: 'javasript', correction: 'JavaScript', type: 'technical_term' },
  { pattern: /\btypescipt\b/i, error: 'typescipt', correction: 'TypeScript', type: 'technical_term' },
  { pattern: /\btypesript\b/i, error: 'typesript', correction: 'TypeScript', type: 'technical_term' },
  { pattern: /\bgit\s+hub\b/i, error: 'git hub', correction: 'GitHub', type: 'technical_term' },
  { pattern: /\bmongo\s+db\b/i, error: 'mongo db', correction: 'MongoDB', type: 'technical_term' },
  { pattern: /\bpostgres\s+sql\b/i, error: 'postgres sql', correction: 'PostgreSQL', type: 'technical_term' },
  { pattern: /\bpostgre\s+sql\b/i, error: 'postgre sql', correction: 'PostgreSQL', type: 'technical_term' },
  { pattern: /\bexpierence\b/i, error: 'expierence', correction: 'experience', type: 'spelling' },
  { pattern: /\bexperiance\b/i, error: 'experiance', correction: 'experience', type: 'spelling' },
  { pattern: /\bprofesional\b/i, error: 'profesional', correction: 'professional', type: 'spelling' },
  { pattern: /\bproffesional\b/i, error: 'proffesional', correction: 'professional', type: 'spelling' },
  { pattern: /\bmanagment\b/i, error: 'managment', correction: 'management', type: 'spelling' },
  { pattern: /\bsuccesful\b/i, error: 'succesful', correction: 'successful', type: 'spelling' },
  { pattern: /\bsuccessfull\b/i, error: 'successfull', correction: 'successful', type: 'spelling' },
  { pattern: /\bdevlopment\b/i, error: 'devlopment', correction: 'development', type: 'spelling' },
  { pattern: /\bdevelopement\b/i, error: 'developement', correction: 'development', type: 'spelling' },
  { pattern: /\bdevloper\b/i, error: 'devloper', correction: 'developer', type: 'spelling' },
  { pattern: /\bdevelopr\b/i, error: 'developr', correction: 'developer', type: 'spelling' },
  { pattern: /\brecieved\b/i, error: 'recieved', correction: 'received', type: 'spelling' },
  { pattern: /\bacheived\b/i, error: 'acheived', correction: 'achieved', type: 'spelling' },
  { pattern: /\bwritting\b/i, error: 'writting', correction: 'writing', type: 'spelling' },
  { pattern: /\bresponsibilies\b/i, error: 'responsibilies', correction: 'responsibilities', type: 'spelling' },
  { pattern: /\bresponisbilities\b/i, error: 'responisbilities', correction: 'responsibilities', type: 'spelling' },
  { pattern: /\brefered\b/i, error: 'refered', correction: 'referred', type: 'spelling' },
  { pattern: /\bcommitee\b/i, error: 'commitee', correction: 'committee', type: 'spelling' },
  { pattern: /\bseperate\b/i, error: 'seperate', correction: 'separate', type: 'spelling' },
  { pattern: /\bdefinately\b/i, error: 'definately', correction: 'definitely', type: 'spelling' },
  { pattern: /\buntill\b/i, error: 'untill', correction: 'until', type: 'spelling' },
  { pattern: /\bbuisness\b/i, error: 'buisness', correction: 'business', type: 'spelling' },
  { pattern: /\bneccessary\b/i, error: 'neccessary', correction: 'necessary', type: 'spelling' },
  { pattern: /\bnecesary\b/i, error: 'necesary', correction: 'necessary', type: 'spelling' },
  { pattern: /\benviroment\b/i, error: 'enviroment', correction: 'environment', type: 'spelling' },
  { pattern: /\bimpliment\b/i, error: 'impliment', correction: 'implement', type: 'spelling' },
  { pattern: /\bindependant\b/i, error: 'independant', correction: 'independent', type: 'spelling' },
  { pattern: /\boccuring\b/i, error: 'occuring', correction: 'occurring', type: 'spelling' },
];

const TECH_DICTIONARY = [
  'nextjs', 'nodejs', 'reactjs', 'mongodb', 'expressjs', 'typescript', 'tailwindcss', 'postgresql',
  'javascript', 'angular', 'vuejs', 'graphql', 'docker', 'kubernetes', 'aws', 'github', 'git', 'c++', 'c#'
];

function getContextSnippet(text, index, wordLength) {
  const start = Math.max(0, index - 25);
  const end = Math.min(text.length, index + wordLength + 25);
  let snippet = text.slice(start, end).replace(/\s+/g, ' ');
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  return snippet.trim();
}

function scanSpellingAndGrammar(text) {
  const spellingIssues = [];
  const lower = text.toLowerCase();
  
  for (const typo of COMMON_TYPOS) {
    const regex = new RegExp(typo.pattern.source, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      const error = match[0];
      const index = match.index;
      const context = getContextSnippet(text, index, error.length);
      
      const alreadyAdded = spellingIssues.some(issue => issue.error === error && issue.context === context);
      if (!alreadyAdded) {
        spellingIssues.push({
          error,
          correction: typo.correction,
          context,
          type: typo.type
        });
      }
      if (spellingIssues.length >= 15) break;
    }
    if (spellingIssues.length >= 15) break;
  }
  
  const score = Math.max(30, 100 - spellingIssues.length * 10);
  return { score, issues: spellingIssues };
}

// Local rule-based ATS checker fallback
async function localAtsCheck(text, targetRole) {
  const lower = text.toLowerCase();
  const requiredSkills = await getRequiredSkillsForRole(targetRole);
  const { matched, missing } = evaluateSkillsForText(text, requiredSkills);

  // Formatting checks
  const formattingDetails = [];

  // 1. Essential Sections (50 pts total)
  const hasExperience = lower.includes('experience') || lower.includes('work') || lower.includes('employment');
  const hasEducation = lower.includes('education') || lower.includes('university') || lower.includes('college');
  const hasSummary = lower.includes('summary') || lower.includes('profile') || lower.includes('about me') || lower.includes('objective') || lower.includes('about');

  let essentialScore = 0;
  if (hasExperience) {
    essentialScore += 20;
    formattingDetails.push('Work Experience section detected.');
  } else {
    formattingDetails.push('Warning: Work Experience section is missing.');
  }

  if (hasEducation) {
    essentialScore += 15;
    formattingDetails.push('Education section detected.');
  } else {
    formattingDetails.push('Warning: Education section is missing.');
  }

  if (hasSummary) {
    essentialScore += 15;
    formattingDetails.push('Professional Summary or Profile section detected.');
  } else {
    formattingDetails.push('Warning: Professional Summary / Profile section is missing.');
  }

  // 2. Contact Info (30 pts total)
  const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(lower);
  const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(lower) || /\+?\d{10,13}/.test(lower);
  const hasLinkedIn = lower.includes('linkedin.com');

  let contactDetailsScore = 0;
  if (hasEmail) {
    contactDetailsScore += 10;
    formattingDetails.push('Email address detected successfully.');
  } else {
    formattingDetails.push('Warning: Email address not found.');
  }

  if (hasPhone) {
    contactDetailsScore += 10;
    formattingDetails.push('Mobile number detected successfully.');
  } else {
    formattingDetails.push('Warning: Mobile number not found.');
  }

  if (hasLinkedIn) {
    contactDetailsScore += 10;
    formattingDetails.push('LinkedIn profile link detected.');
  } else {
    formattingDetails.push('Warning: LinkedIn profile link not found.');
  }

  // 3. Layout & Flow (20 pts total)
  const wordCount = text.split(/\s+/).length;
  const hasOptimalLength = wordCount >= 100 && wordCount <= 1500;
  let lengthScore = 0;
  if (hasOptimalLength) {
    lengthScore = 10;
    formattingDetails.push('Resume length is optimal (1-2 pages equivalent).');
  } else {
    formattingDetails.push(`Warning: Resume length is sub-optimal (${wordCount} words).`);
  }

  // Find Section Flow Order
  function findHeadingIndex(txt, terms) {
    for (const term of terms) {
      const idx = txt.indexOf(term);
      if (idx !== -1) return idx;
    }
    return -1;
  }
  const idxSummary = findHeadingIndex(lower, ['summary', 'profile', 'about me', 'objective']);
  const idxSkills = findHeadingIndex(lower, ['skills', 'core competencies', 'technical skills', 'technologies']);
  const idxExperience = findHeadingIndex(lower, ['experience', 'work', 'employment', 'history']);
  const idxProjects = findHeadingIndex(lower, ['projects', 'portfolio', 'personal projects']);
  const idxEducation = findHeadingIndex(lower, ['education', 'academic', 'university', 'college']);

  const indices = [
    { name: 'Summary', index: idxSummary },
    { name: 'Skills', index: idxSkills },
    { name: 'Experience', index: idxExperience },
    { name: 'Projects', index: idxProjects },
    { name: 'Education', index: idxEducation }
  ].filter(item => item.index !== -1);

  let hasLogicalFlow = true;
  for (let i = 0; i < indices.length - 1; i++) {
    if (indices[i].index > indices[i+1].index) {
      hasLogicalFlow = false;
      break;
    }
  }

  let flowScore = 0;
  if (hasLogicalFlow) {
    flowScore = 10;
    formattingDetails.push('Section layout flow is logical and standard.');
  } else {
    formattingDetails.push('Warning: Section flow is non-standard or out of order.');
  }

  const formattingScore = essentialScore + contactDetailsScore + lengthScore + flowScore;

  // Recommendations
  const recommendations = [];
  if (matched.length < requiredSkills.length) {
    recommendations.push(`Add missing role-specific skills: ${missing.slice(0, 3).join(', ')}.`);
  }
  if (!hasEmail || !hasPhone) {
    recommendations.push('Ensure your email and mobile number are prominently displayed at the top of the resume.');
  }
  if (!hasLinkedIn) {
    recommendations.push('Add your LinkedIn profile link to the contact details section to increase professional visibility.');
  }
  if (!hasSummary) {
    recommendations.push('Include a brief "Professional Summary" or "Profile" section at the top of your resume.');
  }
  if (!hasExperience) {
    recommendations.push('Structure your work experience with clear headings, job titles, companies, and dates.');
  }
  const hasProjects = lower.includes('project') || lower.includes('portfolio') || lower.includes('personal projects') || lower.includes('academic projects');
  if (!hasProjects) {
    recommendations.push('Add a Projects section to showcase hands-on application of your technical skills.');
  }
  if (!hasLogicalFlow) {
    recommendations.push('Improve section flow: Reorder your resume sections to follow the standard professional layout: Contact Info -> Summary -> Skills -> Experience -> Projects -> Education.');
  }
  if (formattingScore < 80) {
    recommendations.push('Use a standard, clean layout without complex multi-column grids or graphics that can confuse ATS parsers.');
  }
  recommendations.push('Quantify achievements with metrics and numbers (e.g., "Improved performance by 20%").');

  const spellingAnalysis = scanSpellingAndGrammar(text);
  const spellingScore = spellingAnalysis.score;

  // Compute final scores using Progressive Tier-Based Curve
  const skillsScore = calculateProgressiveSkillsScore(matched.length, requiredSkills.length);
  const keywordScore = calculateProgressiveSkillsScore(matched.length, requiredSkills.length);
  const projectsScore = hasProjects ? 100 : 40;
  const educationScore = hasEducation ? 100 : 40;
  const contactScore = (hasEmail ? 50 : 0) + (hasPhone ? 50 : 0);

  // Updated Weights: Skills (35%), Formatting (25%), Keywords (20%), Spelling (5%), Projects (10%), Education (3%), Contact (2%)
  const score = Math.round(
    (skillsScore * 0.35) +
    (formattingScore * 0.25) +
    (keywordScore * 0.20) +
    (spellingScore * 0.05) +
    (projectsScore * 0.10) +
    (educationScore * 0.03) +
    (contactScore * 0.02)
  );

  return {
    score,
    skillsMatch: {
      matched,
      missing,
      totalRequired: requiredSkills.length
    },
    formatting: {
      score: formattingScore,
      details: formattingDetails,
    },
    keywords: {
      optimized: matched,
      suggestions: missing,
    },
    spellingGrammar: spellingAnalysis,
    recommendations: recommendations,
  };
}

function calculateProgressiveSkillsScore(matchedCount, totalRequired) {
  if (totalRequired === 0) return 70;
  if (matchedCount === 0) {
    return 40;
  } else if (matchedCount <= 5) {
    return Math.round(40 + (matchedCount / 5) * 25);
  } else if (matchedCount <= 10) {
    return Math.round(65 + ((matchedCount - 5) / 5) * 15);
  } else if (matchedCount <= 15) {
    return Math.round(80 + ((matchedCount - 10) / 5) * 10);
  } else if (matchedCount <= 20) {
    return Math.round(90 + ((matchedCount - 15) / 5) * 5);
  } else {
    return 95;
  }
}

const ROLE_SKILLS_CACHE = {};

async function getRequiredSkillsForRole(roleName) {
  if (!roleName) return [];
  const normalizedRole = roleName.trim().toLowerCase();
  
  // 1. Check predefined mapping
  if (ROLE_SKILL_MAP[normalizedRole]) {
    return ROLE_SKILL_MAP[normalizedRole];
  }
  
  // 2. Check in-memory cache
  if (ROLE_SKILLS_CACHE[normalizedRole]) {
    return ROLE_SKILLS_CACHE[normalizedRole];
  }
  
  // 3. Fallback: Ask Gemini to generate the skills list
  if (genAI) {
    try {
      const prompt = `
You are an expert technical recruiter. Generate a list of exactly 8-10 essential technical skills, tools, or domain keywords required for the job role: "${roleName}".
Provide only the names of the skills/tools, capitalized professionally.

Return a JSON object with this exact structure:
{
  "skills": ["Skill 1", "Skill 2", "Skill 3", ...]
}
`;
      const responseText = await generateGeminiContentWithFallback(prompt, { 
        responseMimeType: 'application/json',
        temperature: 0 
      });
      const parsed = JSON.parse(responseText);
      if (parsed.skills && Array.isArray(parsed.skills)) {
        ROLE_SKILLS_CACHE[normalizedRole] = parsed.skills;
        console.log(`✦ Cached generated skills for custom role "${roleName}":`, parsed.skills);
        return parsed.skills;
      }
    } catch (err) {
      console.error(`Error generating skills for role "${roleName}":`, err);
    }
  }
  
  // Default fallback if everything fails
  return ['Communication', 'Problem Solving', 'Project Management', 'Technical Documentation'];
}

function evaluateSkillsForText(text, requiredSkills) {
  const lower = text.toLowerCase();
  const matched = [];
  const missing = [];
  
  for (const skill of requiredSkills) {
    const keywords = SKILL_KEYWORDS[skill] || [skill.toLowerCase()];
    const isMatched = keywords.some(k => {
      const firstChar = k[0];
      const lastChar = k[k.length - 1];
      const startsWithLetter = /[a-zA-Z]/.test(firstChar);
      const endsWithLetter = /[a-zA-Z]/.test(lastChar);

      const leftBoundary = startsWithLetter ? '(?:^|[^a-zA-Z])' : '';
      const rightBoundary = endsWithLetter ? '(?:$|[^a-zA-Z])' : '';

      const escaped = k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(leftBoundary + escaped + rightBoundary, 'i');
      return regex.test(lower);
    });
    if (isMatched) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  }
  
  return { matched, missing };
}

// POST /api/ai/public/ats-check (PUBLIC - No Auth required)
router.post('/public/ats-check', async (req, res) => {
  const { resumeBase64, targetRole } = req.body;
  if (!resumeBase64) {
    return res.status(400).json({ error: 'Please upload a PDF resume.' });
  }

  try {
    const buffer = Buffer.from(resumeBase64, 'base64');
    const pdfParse = require('pdf-parse');
    const parsed = await pdfParse(buffer);
    const text = parsed.text;

    if (!text || text.trim().length < 50) {
      return res.status(400).json({ error: 'Failed to extract text from the PDF. Please make sure the PDF is not an image scan.' });
    }

    // Resolve required skills for targetRole (predefined + dynamic fallback with cache)
    const requiredSkills = await getRequiredSkillsForRole(targetRole);
    const { matched, missing } = evaluateSkillsForText(text, requiredSkills);

    if (genAI) {
      try {
        const prompt = `
You are a professional ATS (Applicant Tracking System) simulator. Analyze the following resume text specifically for the target job role: "${targetRole || 'General Professional'}".

Resume Text:
"${text}"

Return a JSON object with this exact structure:
{
  "formatting": {
    "hasEmail": Boolean (true if an email address is detected, false otherwise),
    "hasPhone": Boolean (true if a phone number/mobile is detected, false otherwise),
    "hasLinkedIn": Boolean (true if a LinkedIn profile link is detected, false otherwise),
    "hasExperienceSection": Boolean (true if a clear Work Experience/Employment History section is detected, false otherwise),
    "hasEducationSection": Boolean (true if a clear Education/Academic section is detected, false otherwise),
    "hasSummarySection": Boolean (true if a professional Summary, Profile, or Objective section is detected, false otherwise),
    "hasProjectsSection": Boolean (true if a clear Projects/Portfolio section is detected, false otherwise),
    "hasOptimalLength": Boolean (true if the word count is between 100 and 1500 words, false otherwise),
    "hasLogicalFlow": Boolean (true if sections follow a logical hierarchy: Contact Info -> Summary -> Skills -> Experience -> Projects -> Education, false otherwise),
    "details": ["Array of formatting findings, e.g. 'Standard fonts used', 'Missing LinkedIn link', 'Sections out of logical order', etc."]
  },
  "keywords": {
    "suggestions": ["Array of specific keyword suggestions for the ${targetRole || 'general'} role to add to boost match rate"]
  },
  "recommendations": ["Array of concrete action items to improve the resume for a ${targetRole || 'general'} position, including formatting, keywords, layout flow, and contact info improvements"]
}
`;
        const responseText = await generateGeminiContentWithFallback(prompt, { 
          responseMimeType: 'application/json',
          temperature: 0 
        });
        const analysis = JSON.parse(responseText);

        const spellingAnalysis = scanSpellingAndGrammar(text);
        const spellingScore = spellingAnalysis.score;

        // Programmatic score calculation based on structured scoring framework
        const formatting = analysis.formatting || {};
        
        let essentialScore = 0;
        if (formatting.hasExperienceSection !== false) essentialScore += 20;
        if (formatting.hasEducationSection !== false) essentialScore += 15;
        if (formatting.hasSummarySection !== false) essentialScore += 15;

        let contactDetailsScore = 0;
        if (formatting.hasEmail !== false) contactDetailsScore += 10;
        if (formatting.hasPhone !== false) contactDetailsScore += 10;
        if (formatting.hasLinkedIn !== false) contactDetailsScore += 10;

        let lengthScore = formatting.hasOptimalLength !== false ? 10 : 0;
        let flowScore = formatting.hasLogicalFlow !== false ? 10 : 0;

        const formattingScore = essentialScore + contactDetailsScore + lengthScore + flowScore;

        const skillsScore = calculateProgressiveSkillsScore(matched.length, requiredSkills.length);
        const keywordScore = calculateProgressiveSkillsScore(matched.length, requiredSkills.length);
        const projectsScore = formatting.hasProjectsSection !== false ? 100 : 40;
        const educationScore = formatting.hasEducationSection !== false ? 100 : 40;
        const contactScore = (formatting.hasEmail !== false ? 35 : 0) + (formatting.hasPhone !== false ? 35 : 0) + (formatting.hasLinkedIn !== false ? 30 : 0);

        // Updated Weights: Skills (35%), Formatting (25%), Keywords (20%), Spelling (5%), Projects (10%), Education (3%), Contact (2%)
        const score = Math.round(
          (skillsScore * 0.35) +
          (formattingScore * 0.25) +
          (keywordScore * 0.20) +
          (spellingScore * 0.05) +
          (projectsScore * 0.10) +
          (educationScore * 0.03) +
          (contactScore * 0.02)
        );

        // Check for specific layout recommendations and add them if not present
        const recommendations = analysis.recommendations || [];
        if (formatting.hasLinkedIn === false && !recommendations.some(r => r.toLowerCase().includes('linkedin'))) {
          recommendations.unshift('Add your LinkedIn profile link to the contact details section to increase professional visibility.');
        }
        if (formatting.hasSummarySection === false && !recommendations.some(r => r.toLowerCase().includes('summary') || r.toLowerCase().includes('profile'))) {
          recommendations.unshift('Include a brief "Professional Summary" or "Profile" section at the top of your resume.');
        }
        if (formatting.hasLogicalFlow === false && !recommendations.some(r => r.toLowerCase().includes('flow') || r.toLowerCase().includes('order'))) {
          recommendations.unshift('Improve section flow: Reorder your resume sections to follow the standard professional layout: Contact Info -> Summary -> Skills -> Experience -> Projects -> Education.');
        }

        const finalAnalysis = {
          score,
          skillsMatch: {
            matched,
            missing,
            totalRequired: requiredSkills.length
          },
          formatting: {
            score: formattingScore,
            details: formatting.details || []
          },
          keywords: {
            optimized: matched,
            suggestions: [...new Set([...missing, ...(analysis.keywords?.suggestions || [])])]
          },
          spellingGrammar: spellingAnalysis,
          recommendations: recommendations
        };

        return res.json({ success: true, analysis: finalAnalysis, is_gemini: true });
      } catch (err) {
        console.error('Gemini ATS Check failed, falling back to local engine:', err);
        const analysis = await localAtsCheck(text, targetRole);
        return res.json({ success: true, analysis, is_gemini: false, fallback: true });
      }
    }

    // Local parser fallback
    const analysis = await localAtsCheck(text, targetRole);
    return res.json({ success: true, analysis, is_gemini: false });
  } catch (err) {
    console.error('ATS Checker error:', err);
    return res.status(500).json({ error: 'An error occurred while parsing the resume. Make sure it is a valid PDF.' });
  }
});

module.exports = router;
