name: Bug Report
description: Report a bug or issue with Certo
labels: ["bug"]
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        Thank you for reporting a bug! Please fill in the details below to help us reproduce and fix the issue.

  - type: textarea
    id: description
    attributes:
      label: Description
      description: A clear and concise description of what the bug is.
      placeholder: "What happened?"
    validations:
      required: true

  - type: textarea
    id: steps
    attributes:
      label: Steps to Reproduce
      description: Steps to reproduce the behavior.
      placeholder: |
        1. Go to '...'
        2. Click on '...'
        3. See error
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: Expected Behavior
      description: What should happen instead?
      placeholder: "I expected..."
    validations:
      required: true

  - type: textarea
    id: actual
    attributes:
      label: Actual Behavior
      description: What actually happened?
      placeholder: "Instead, I got..."
    validations:
      required: true

  - type: textarea
    id: environment
    attributes:
      label: Environment
      description: Environment details where the bug occurs
      placeholder: |
        - OS: macOS 14, Ubuntu 22.04, Windows 11
        - Node.js version: 18, 20, 22
        - Browser: Chrome 120, Firefox 121
        - Deployment: docker-compose, Kubernetes, self-hosted
      value: |
        - OS: 
        - Node.js version: 
        - Browser: 
        - Deployment: 

  - type: textarea
    id: logs
    attributes:
      label: Logs or Error Messages
      description: Paste any relevant error messages or logs (in backticks)
      placeholder: |
        ```
        Error: ...
        at ...
        ```
      render: shell

  - type: textarea
    id: screenshots
    attributes:
      label: Screenshots
      description: If applicable, add screenshots to help explain the problem.
      placeholder: "Paste images here"

  - type: textarea
    id: context
    attributes:
      label: Additional Context
      description: Any other context about the problem?
      placeholder: "Anything else?"

  - type: checkboxes
    id: checklist
    attributes:
      label: Pre-submission Checklist
      options:
        - label: I have searched existing issues and found no duplicates
          required: true
        - label: I have provided all relevant environment details
          required: true
        - label: I have included steps to reproduce the issue
          required: false
