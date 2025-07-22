export interface ListContent {
  [key: string]: {
    text: string
    component: 'span' | 'code'
  }[]
}

export default () => {
  const title = 'How does it work?'
  const subtitle = 'Just few simple steps to start create certificates for your business'
  const steps = [
    'Strapi Admin User creates certificates',
    'Company Issuer sends certificates',
    'Recipients receive & share certificates'
  ]
  const listTitle = 'Get Started in 3 Steps'

  const list: ListContent = {
    1: [
      { text: 'Clone the Certo repository:', component: 'span' },
      { text: 'git clone https://github.com/schroedinger-hat/certo.git', component: 'code' }
    ],
    2: [
      { text: 'Bootstrap the frontend and backend:', component: 'span' },
      { text: 'Navigate to the project directory and install dependencies for both apps:', component: 'span' },
      { text: 'cd certo/src/frontend && npm install', component: 'code' },
      { text: 'cd ../backend && npm install', component: 'code' },
      { text: 'Start both servers:', component: 'span' },
      { text: 'npm run dev', component: 'code' }
    ],
    3: [
      { text: 'Set up Strapi achievements and roles:', component: 'span' },
      { text: 'In the Strapi admin panel, create an admin account then create a new Achievement and assign roles for issuers. Create an Issuer account, then sign in on the frontend and start sending certificates.', component: 'span' }
    ]
  }

  return {
    list,
    listTitle,
    steps,
    subtitle,
    title,
  }
}
