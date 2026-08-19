name: Feature Request
description: Suggest a new feature or enhancement
labels: ["enhancement"]
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        Thank you for suggesting an enhancement! Please tell us about your idea.

  - type: textarea
    id: problem
    attributes:
      label: Problem or Use Case
      description: Describe the problem you're trying to solve or the use case
      placeholder: |
        I am trying to...
        Currently, I have to...
        It would be great if...
    validations:
      required: true

  - type: textarea
    id: solution
    attributes:
      label: Proposed Solution
      description: Describe the solution you have in mind
      placeholder: "I suggest..."
    validations:
      required: true

  - type: textarea
    id: alternatives
    attributes:
      label: Alternative Solutions
      description: Have you considered any alternative approaches?
      placeholder: "Other approaches could be..."

  - type: textarea
    id: examples
    attributes:
      label: Example or Mockup
      description: If applicable, provide an example, mockup, or API sketch
      placeholder: "Example code or design..."

  - type: textarea
    id: impact
    attributes:
      label: Impact
      description: How would this feature benefit users? Who would it help?
      placeholder: |
        - Helps issuers with bulk operations
        - Improves recipient experience when...
        - Enables integration with...

  - type: checkboxes
    id: checklist
    attributes:
      label: Pre-submission Checklist
      options:
        - label: I have searched existing issues and discussions
          required: true
        - label: I have checked the roadmap for related planned work
          required: false
        - label: This is not a duplicate of an existing request
          required: true
