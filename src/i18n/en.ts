export const en = {
  // Hero
  'hero.badge': '100% Zero-Knowledge Architecture',
  'hero.title_start': 'Enterprise AI,',
  'hero.title_highlight': 'Without the Compromise.',
  'hero.subtitle': 'Secure, private, and localized AI chat and API infrastructure. Backed by client-side ECIES encryption and managed compute.',
  'hero.cta_primary': 'Launch Workspace',
  'hero.cta_secondary': 'Read the Docs',
  
  // Capabilities
  'home.section_title': 'Intelligence Tailored to the Task',
  'home.section_subtitle': 'Opaque, highly-optimized routing ensures you get the right reasoning model for the right price, instantly.',
  'home.fast.title': 'Fast',
  'home.fast.desc': 'Optimized for low-latency tasks, drafting, and instant summarization. Uncapped usage for smooth workflows.',
  'home.fast.badge': '0.2x Token Weight',
  'home.pro.title': 'Pro',
  'home.pro.desc': 'High-fidelity reasoning and complex instruction following for heavy enterprise workloads.',
  'home.pro.badge': '1.0x Token Weight',
  'home.deep.title': 'Deep Research',
  'home.deep.desc': 'Multi-step autonomous reasoning with built-in prolog loops for deep analytical tasks.',
  'home.deep.badge': '1.2x Token Weight',

  // Security Architecture
  'home.eyebrow': 'Zero-Trust By Design',
  'home.title': 'Cryptographic Privacy You Can Verify',
  'home.subtitle': 'We engineered our infrastructure so that neither DCP nor our cloud provider can inspect your conversation context.',
  'home.passkey.title': 'Passkey-Derived Sessions',
  'home.passkey.desc': 'Every chat session generates a dedicated AES key anchored directly to your hardware authenticator using WebAuthn.',
  'home.envelope.title': 'ECIES Envelope Wrapping',
  'home.envelope.desc': 'Keys are transmitted inside an ECIES envelope decoded strictly in memory, preventing raw keys from ever surfacing in GCP request logs.',
  'home.zk.title': 'Zero-Knowledge Context',
  'home.zk.desc': 'Context history is stored in ciphertext. We maintain the database, but only client-authenticated sessions hold the decryption keys.',
  'home.tee.title': 'Client-to-GPU TEE',
  'home.tee.desc': 'Full end-to-end encryption extending from your browser directly into hardware-isolated Confidential GPU enclaves.',
  'home.tee.tag': 'Roadmap',

  // Pricing
  'home.price_title': 'Transparent, Capability-Based Pricing',
  'home.price_subtitle': 'Choose a workspace subscription for your team, or pay-as-you-go for direct API integration.',
  'home.workspace_title': 'Workspace Subscriptions',
  'home.standard.desc': 'Ideal for everyday tasks and standard workloads.',
  'home.month': 'month',
  'home.feat.fast_unlimited': 'Unlimited Fast Model usage',
  'home.feat.pro_standard': 'Pro Model (Standard 4-hour quota)',
  'home.feat.degrade': 'Graceful shift to Fast when quota is met',
  'home.recommended': 'Recommended',
  'home.enterprise.desc': 'For heavy analytics, research, and data science.',
  'home.feat.pro_high': 'Pro Model (High 4-hour quota)',
  'home.feat.deep_research': 'Deep Research Model access',
  'home.feat.jupyter': 'Managed Jupyter Compute included',
  'home.api_title': 'API Pay-As-You-Go',
  'home.api_desc': 'API usage is billed per token. Cost is calculated dynamically based on the capability weight of the chosen endpoint.',
  'home.weight': 'Multiplier',
  'home.sar': 'SAR',

  // App Teaser
  'app.title': 'Take Zero-Knowledge AI on the Go',
  'app.subtitle': 'Our native mobile apps will bring full end-to-end encryption and seamless workspace syncing to your pocket.',
  'app.download': 'Download on the',
  'app.coming_soon': 'Coming Soon',

  // Auth Modal
  'auth.title_login': 'Welcome Back',
  'auth.subtitle_login': 'Sign in securely using your hardware passkey.',
  'auth.title_signup': 'Create Your Account',
  'auth.subtitle_signup': 'Step 1: Authenticate with your provider.',
  'auth.title_step2': 'Secure Your Account',
  'auth.subtitle_step2': 'Step 2: Register a hardware passkey to enable end-to-end encryption.',
  'auth.google': 'Continue with Google',
  'auth.passkeyLogin': 'Sign in with Passkey',
  'auth.passkeySignup': 'Register Passkey',
  'auth.noAccount': "Don't have an account?",
  'auth.hasAccount': 'Already have an account?',
  'auth.signUpToggle': 'Sign Up',
  'auth.signInToggle': 'Sign In',
  'auth.sessionExpired': 'Session expired. Please sign in again.',
  'auth.cancel': 'Cancel',

  // Navigation
  'nav.login': 'Sign In',
  'nav.workspace': 'Workspace',
  'nav.logout': 'Sign Out',
	'nav.capabilities': 'Capabilities',
  'nav.security': 'Security',
  'nav.pricing': 'Pricing',
  'nav.docs': 'Documentation',
	'nav.enterprise': 'Enterprise',

	// Footer
  'footer.rights': '© 2026 DCP Cloud. All rights reserved.',
  'footer.privacy': 'Privacy Policy',
  'footer.terms': 'Terms of Service',

	// Capabilities Page
  'cap.hero.title': 'Intelligence at Your Fingertips. Compute on Your Terms.',
  'cap.hero.subtitle': 'From zero-knowledge conversational AI to drop-in APIs and managed Jupyter environments, DCP Cloud delivers the exact compute weight you need, the moment you need it.',
  
  'cap.models.title': 'The Model Fleet',
  'cap.fast.title': 'dcp/fast',
  'cap.fast.desc': 'The Workhorse. Optimized for low latency and high throughput. Perfect for real-time chat, data extraction, and drafting. Unlimited on Workspace tiers.',
  'cap.pro.title': 'dcp/pro',
  'cap.pro.desc': 'The Reasoner. Advanced reasoning for complex logic, coding, and multi-step workflows. Operates on a 4-hour rolling quota.',
  'cap.pro.degrade': 'Chat UX: Gracefully degrades to Fast when quota is met.',
  'cap.research.title': 'dcp/deep-research',
  'cap.research.desc': 'The Analyst. Massive context window and deep web synthesis for exhaustive research reports and heavy data analysis.',
  
  'cap.interfaces.title': 'Delivery Interfaces',
  'cap.ws.title': 'Zero-Knowledge Workspace',
  'cap.ws.desc': 'A highly secure, passkey-protected chat interface built for enterprise teams.',
  'cap.ws.feat1': 'End-to-end encrypted history',
  'cap.ws.feat2': 'Seamless model switching & graceful degradation',
  
  'cap.api.title': 'Drop-In API (OpenAI Compatible)',
  'cap.api.desc': 'Don\'t rewrite your apps. Just change the base URL and API key to connect to our endpoints.',
  'cap.api.feat1': 'Stateless architecture (prompts never logged)',
  'cap.api.feat2': 'Weighted token billing (pay exactly for what you use)',
  
  'cap.jupyter.title': 'Data Science, Fully Managed',
  'cap.jupyter.subtitle': 'Skip the DevOps. Spin up isolated, high-performance Jupyter Notebooks pre-configured with the latest ML frameworks. Access raw GPU compute backed by encrypted, persistent block storage—billed by the minute.',
  
  'cap.guarantees.title': 'Enterprise Guarantees',
  'cap.g1.title': 'Saudi Data Residency',
  'cap.g1.desc': '100% of compute and data storage remains physically within the KSA infrastructure.',
  'cap.g2.title': 'Zero-Knowledge Pipeline',
  'cap.g2.desc': 'We cannot read your prompts. Everything is encrypted at rest via ECIES and AES-256.',
  'cap.g3.title': 'Predictable Scaling',
  'cap.g3.desc': 'High-availability infrastructure ensuring your production APIs stay responsive under load.',

	// Security Page
  'sec.hero.title': 'Cryptographic Privacy. Zero-Knowledge Storage.',
  'sec.hero.subtitle': 'DCP Cloud is built on a fundamental premise: your data is yours. Using advanced WebAuthn PRF and ECIES enveloping, we ensure your chat histories remain mathematically inaccessible to anyone but you.',
  
  'sec.flow.title': 'The Cryptographic Flow',
  'sec.flow.step1.title': '1. PRF-Derived Session Keys',
  'sec.flow.step1.desc': 'Every chat session (UUIDv7) generates a unique AES encryption key client-side, derived directly from your biometric Passkey via WebAuthn PRF.',
  'sec.flow.step2.title': '2. ECIES Key Enveloping',
  'sec.flow.step2.desc': 'Before leaving your device, messages are encrypted with the AES key. The AES key itself is then sealed in an ECIES envelope using the server\'s public key.',
  'sec.flow.step3.title': '3. Just-in-Time Processing',
  'sec.flow.step3.desc': 'The server unwraps the envelope in RAM, decrypts the context to process the inference, and immediately encrypts the response using the same AES key for database storage.',
  'sec.flow.step4.title': '4. Ephemeral Memory',
  'sec.flow.step4.desc': 'The moment the inference completes, the garbage collector purges the AES key from memory. We store your encrypted history, but never retain the key to unlock it.',

  'sec.identity.title': 'Authentication that Doubles as Encryption',
  'sec.identity.desc': 'Passwords are the weakest link in enterprise security. DCP Cloud enforces WebAuthn by default. Your Passkey doesn\'t just authenticate you against phishing—it actively participates in generating the cryptographic keys that secure your data.',
  
  'sec.residency.title': 'Sovereign Data Residency',
  'sec.residency.desc': 'Core routing, user identity, and 100% of your encrypted data at rest are physically anchored within data centers in the Kingdom of Saudi Arabia, ensuring strict compliance with local data residency laws.',

  'sec.notrain.title': 'Your Data Will Never Be Our Product',
  'sec.notrain.desc': 'We sell premium compute, not data. Your API requests, encrypted chat histories, and contexts are categorically excluded from any model fine-tuning or training pipelines.',

	// Pricing Page
  'price.hero.title': 'Simple, Predictable Pricing',
  'price.hero.subtitle': 'Choose a Workspace subscription for your everyday workflows, or pay-as-you-go with our drop-in API. Zero-knowledge privacy included on all tiers.',
  
  'price.month': 'mo',
  'price.recommended': 'Recommended',
  'price.contact_sales': 'Contact Sales',
  
  // Tiers
  'price.starter.title': 'Starter',
  'price.starter.desc': 'Perfect for everyday corporate workflows and drafting.',
  'price.starter.feat1': 'Unlimited dcp/fast access',
  'price.starter.feat2': 'Standard dcp/pro quota',
  'price.starter.feat3': 'Zero-Knowledge Workspace',
  'price.starter.feat4': 'No API access',
  
  'price.pro.title': 'Professional',
  'price.pro.desc': 'The complete toolkit for power users, analysts, and researchers.',
  'price.pro.feat1': '2X dcp/pro quota',
  'price.pro.feat2': 'dcp/deep-research access',
  'price.pro.feat3': 'Drop-in API access',
  'price.pro.feat4': '10h/week of CPU/GPU time (Jupyter)',
  
  'price.ultra.title': 'Ultra',
  'price.ultra.desc': 'Massive capacity for heavy institutional workloads.',
  'price.ultra.feat1': '10X dcp/pro quota',
  'price.ultra.feat2': 'Highest priority compute',
  
  // Teams
  'price.teams.title': 'Corporate Teams',
  'price.teams.desc': 'Built for scale. Securely deploy DCP Cloud across your entire organization with centralized controls.',
  'price.teams.min_seats': 'Minimum of 25 seats',
  'price.teams.feat1': 'Corporate SSO (SAML / OIDC)',
  'price.teams.feat2': 'Centralized billing & admin panel',
  'price.teams.feat3': 'Dedicated account manager',
  
  // API
  'price.api.title': 'Drop-In API Pricing',
  'price.api.subtitle': 'For developers. We use a single, unified token budget with weighted billing. Pay exactly for the compute weight you use. Prompts are never stored.',
  'price.api.base': 'Base Rate',
  'price.api.weight_in': 'Input Weight',
  'price.api.weight_out': 'Output Weight',
  'price.api.note': '*Output tokens carry a 3.0x multiplier across all models.',

	// Enterprise Page
  'ent.hero.title': 'Enterprise AI. Sovereign Infrastructure.',
  'ent.hero.subtitle': 'Move beyond standard APIs. We partner with Saudi enterprises to build custom agentic workflows, securely integrate private knowledge bases, and provide access to dedicated sovereign compute.',
  
  'ent.sol.title': 'Custom Engineering & Integration',
  'ent.sol.agents.title': 'Agentic Workflows',
  'ent.sol.agents.desc': 'We build autonomous agents that execute multi-step corporate processes, from automated compliance auditing to intelligent data routing.',
  'ent.sol.data.title': 'Private Data Integration',
  'ent.sol.data.desc': 'Securely connect our LLMs directly to your internal company databases, ERPs, and unstructured knowledge bases without the data ever leaving Saudi.',
  'ent.sol.models.title': 'Custom Model Hosting',
  'ent.sol.models.desc': 'Need to run your own fine-tuned models or specific open-weight architectures? We provide the isolated environment to host and serve them securely.',
  
  'ent.zks.title': 'Zero-Knowledge Security, Already Solved.',
  'ent.zks.desc': 'Don\'t waste months in architecture reviews trying to build air-gapped on-premise solutions. AI compute economics require massive scale; running isolated hardware is a financial loss. We have already solved Zero-Knowledge Security (ZKS) for enterprise AI. You get out-of-the-box cryptographic privacy on highly optimized, local infrastructure.',
  
  'ent.compute.title': 'Bare-Metal AI Accelerators',
  'ent.compute.desc': 'The region faces a compute bottleneck. We are developing a custom orchestration stack to unlock next-generation AI accelerators within local data centers. Get bare-metal access, custom kernels, and massive batch-processing capabilities engineered for unique hardware workloads.',
  
  'ent.form.title': 'Let\'s Talk',
  'ent.form.name': 'Full Name',
  'ent.form.email': 'Corporate Email',
  'ent.form.company': 'Company',
  'ent.form.interest': 'Area of Interest',
  'ent.form.submit': 'Request Consultation',
  'ent.form.opt_agents': 'Agentic Workflows',
  'ent.form.opt_data': 'Private Data / RAG',
  'ent.form.opt_compute': 'Raw Compute / Custom Models',

	// Docs Page
  'docs.hero.title': 'API Documentation',
  'docs.hero.subtitle': 'DCP Cloud is 100% OpenAI-compatible. Use your existing SDKs, simply change the Base URL and API key.',
  
  'docs.endpoint.title': 'Base Endpoint',
  'docs.endpoint.desc': 'All API requests should be routed to this base URL:',
  
  'docs.models.title': 'Available Models',
  'docs.models.desc': 'Pass these exact strings into the `model` parameter:',
  
  'docs.quickstart.title': 'Quickstart Examples',
  'docs.quickstart.desc': 'Select your preferred language below to see how to connect using standard OpenAI libraries.',
};