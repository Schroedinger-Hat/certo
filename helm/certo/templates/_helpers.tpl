{{- define "certo.name" -}}
{{- .Chart.Name -}}
{{- end -}}

{{- define "certo.fullname" -}}
{{- .Release.Name -}}
{{- end -}}

{{- define "certo.labels" -}}
app.kubernetes.io/name: {{ include "certo.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
{{- end -}}

{{- define "certo.backend.fullname" -}}
{{- printf "%s-backend" (include "certo.fullname" .) -}}
{{- end -}}

{{- define "certo.backend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "certo.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: backend
{{- end -}}

{{- define "certo.frontend.fullname" -}}
{{- printf "%s-frontend" (include "certo.fullname" .) -}}
{{- end -}}

{{- define "certo.frontend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "certo.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: frontend
{{- end -}}

{{- define "certo.postgresql.fullname" -}}
{{- printf "%s-postgresql" (include "certo.fullname" .) -}}
{{- end -}}

{{- define "certo.postgresql.selectorLabels" -}}
app.kubernetes.io/name: {{ include "certo.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: postgresql
{{- end -}}

{{- define "certo.secretName" -}}
{{- printf "%s-secrets" (include "certo.fullname" .) -}}
{{- end -}}

{{/*
Looks up an existing value in the already-deployed Secret (if any), falling
back to a freshly generated random string. Used so `helm upgrade` never
rotates a secret that was already generated on install. Usage:
{{ include "certo.secretValue" (dict "root" $ "explicit" .Values.secrets.jwtSecret "key" "jwtSecret" "length" 32) }}
*/}}
{{- define "certo.secretValue" -}}
{{- $explicit := .explicit -}}
{{- if $explicit -}}
{{- $explicit -}}
{{- else -}}
{{- $existing := lookup "v1" "Secret" .root.Release.Namespace (include "certo.secretName" .root) -}}
{{- if $existing -}}
{{- index $existing.data .key | b64dec -}}
{{- else -}}
{{- randAlphaNum .length -}}
{{- end -}}
{{- end -}}
{{- end -}}
