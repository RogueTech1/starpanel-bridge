export function catalog(root) {
  const rows = [];
  function walk(type, prefix, depth = 0) {
    if (depth > 12) return;
    for (const field of type.fieldsArray) {
      field.resolve();
      const path = prefix ? `${prefix}.${field.name}` : field.name;
      if (field.resolvedType?.fieldsArray && !field.repeated) walk(field.resolvedType, path, depth + 1);
      else rows.push({path, type: field.type, repeated: field.repeated,
        presence: field.partOf ? 'explicit' : 'wire presence only',
        enums: field.resolvedType?.values ?? null});
    }
  }
  walk(root.lookupType('sc.game.telemetry.v1.TelemetryStreamResponse'), '');
  return rows;
}
