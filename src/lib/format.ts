export function formatCount(value: number): string {
  return value.toLocaleString('pt-BR');
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${formatCount(count)} ${count === 1 ? singular : plural}`;
}
