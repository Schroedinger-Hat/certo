<template>
  <pre class="code-block"><code><slot /></code></pre>
</template>

<style scoped>
.code-block {
  background: rgba(90, 182, 159, 0.1);
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 0.95rem;
  border: 1px solid rgba(90, 182, 159, 0.2);
}

code {
  color: #5AB69F;
  font-family: 'Courier New', monospace;
}
</style>
