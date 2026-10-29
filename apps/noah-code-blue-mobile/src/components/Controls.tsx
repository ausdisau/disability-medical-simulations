import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

export const colors = {
  ink: '#102C40', muted: '#486172', navy: '#0B263A', teal: '#086D66', tealLight: '#E2F3ED',
  canvas: '#F0F4F6', white: '#FFFFFF', border: '#C7D5DC', amber: '#FFF2D8', amberInk: '#744500',
  red: '#9D273A', redLight: '#FCE9ED', quiet: '#E9EFF3', blue: '#174B78',
};

export function ActionButton({ label, onPress, tone = 'secondary', disabled = false, hint, selected, style }: {
  label: string; onPress: () => void; tone?: 'primary' | 'secondary' | 'danger' | 'quiet';
  disabled?: boolean; hint?: string; selected?: boolean; style?: ViewStyle;
}) {
  const filled = tone === 'primary' || tone === 'danger';
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint}
    accessibilityState={{ disabled, selected }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [s.button, tone === 'primary' && s.primary, tone === 'danger' && s.danger,
      tone === 'quiet' && s.quiet, selected && s.selected, pressed && !disabled && s.pressed, disabled && s.disabled, style]}>
    <Text style={[s.buttonText, filled && s.buttonTextFilled, selected && !filled && s.selectedText]}>{label}</Text>
  </Pressable>;
}

export function CheckControl({ label, detail, checked, onPress, disabled = false }: {
  label: string; detail?: string; checked: boolean; onPress: () => void; disabled?: boolean;
}) {
  return <Pressable accessibilityRole="checkbox" accessibilityLabel={label} accessibilityHint={detail}
    accessibilityState={{ checked, disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [s.check, checked && s.checked, pressed && s.pressed, disabled && s.disabled]}>
    <Text style={s.checkMark} accessible={false}>{checked ? '✓' : '○'}</Text>
    <View style={s.checkCopy}><Text style={s.checkLabel}>{label}</Text>{detail ? <Text style={s.helper}>{detail}</Text> : null}</View>
  </Pressable>;
}

export function Card({ title, eyebrow, children, tone = 'normal' }: {
  title?: string; eyebrow?: string; children: ReactNode; tone?: 'normal' | 'warm' | 'arrest';
}) {
  return <View style={[s.card, tone === 'warm' && s.warm, tone === 'arrest' && s.arrest]}>
    {eyebrow ? <Text style={s.eyebrow}>{eyebrow}</Text> : null}
    {title ? <Text accessibilityRole="header" style={s.cardTitle}>{title}</Text> : null}
    {children}
  </View>;
}

export function NumericControl({ label, value, unit, step, min, max, decimals = 0, disabled = false, onChange }: {
  label: string; value: number; unit: string; step: number; min: number; max: number;
  decimals?: number; disabled?: boolean; onChange: (value: number) => void;
}) {
  const change = (direction: number) => onChange(Number(Math.min(max, Math.max(min, value + direction * step)).toFixed(4)));
  return <View style={s.numberControl}>
    <Text style={s.numberLabel}>{label}</Text>
    <View style={s.numberRow}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${label} by ${step} ${unit}`}
        accessibilityState={{ disabled: disabled || value <= min }} disabled={disabled || value <= min}
        onPress={() => change(-1)} style={({ pressed }) => [s.stepper, pressed && s.pressed, (disabled || value <= min) && s.disabled]}>
        <Text style={s.stepperText}>−</Text>
      </Pressable>
      <View style={s.numberValue} accessible accessibilityLabel={`${label}, ${value.toFixed(decimals)} ${unit}`}>
        <Text style={s.numericText}>{value.toFixed(decimals)} <Text style={s.unit}>{unit}</Text></Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Increase ${label} by ${step} ${unit}`}
        accessibilityState={{ disabled: disabled || value >= max }} disabled={disabled || value >= max}
        onPress={() => change(1)} style={({ pressed }) => [s.stepper, pressed && s.pressed, (disabled || value >= max) && s.disabled]}>
        <Text style={s.stepperText}>+</Text>
      </Pressable>
    </View>
  </View>;
}

export function Metric({ label, value, unit, note }: { label: string; value: string; unit?: string; note: string }) {
  return <View style={s.metric} accessible accessibilityLabel={`${label}: ${value} ${unit ?? ''}. ${note}`}>
    <Text style={s.metricLabel}>{label}</Text><Text style={s.metricValue}>{value} <Text style={s.unit}>{unit}</Text></Text>
    <Text style={s.metricNote}>{note}</Text>
  </View>;
}

export function Paragraph({ children, subtle = false }: { children: ReactNode; subtle?: boolean }) {
  return <Text style={[s.paragraph, subtle && s.helper]}>{children}</Text>;
}

export const shared = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  sectionGap: { gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});

const s = StyleSheet.create({
  button: { minHeight: 48, minWidth: 48, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', flexShrink: 1 },
  primary: { backgroundColor: colors.teal, borderColor: colors.teal }, danger: { backgroundColor: colors.red, borderColor: colors.red }, quiet: { backgroundColor: colors.quiet },
  selected: { borderColor: colors.teal, backgroundColor: colors.tealLight, borderWidth: 2 },
  pressed: { opacity: 0.7 }, disabled: { opacity: 0.42 },
  buttonText: { color: colors.ink, fontSize: 16, fontWeight: '700', textAlign: 'center', flexShrink: 1 }, buttonTextFilled: { color: colors.white }, selectedText: { color: colors.teal },
  check: { flexDirection: 'row', gap: 12, padding: 14, minHeight: 56, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 10, alignItems: 'center' },
  checked: { backgroundColor: colors.tealLight, borderColor: colors.teal }, checkMark: { color: colors.teal, fontSize: 25, fontWeight: '700' }, checkCopy: { flex: 1, gap: 3 },
  checkLabel: { color: colors.ink, fontSize: 16, fontWeight: '600' }, helper: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  card: { padding: 18, gap: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16 },
  warm: { backgroundColor: colors.amber, borderColor: '#DBC391' }, arrest: { backgroundColor: colors.redLight, borderColor: '#D9A7B1' },
  cardTitle: { color: colors.ink, fontSize: 21, lineHeight: 28, fontWeight: '700' }, eyebrow: { color: colors.teal, fontSize: 12, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  paragraph: { color: colors.ink, fontSize: 16, lineHeight: 24 },
  numberControl: { flexGrow: 1, flexBasis: 240, gap: 7, paddingVertical: 5 }, numberLabel: { fontSize: 15, color: colors.muted, fontWeight: '600' },
  numberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, numberValue: { flex: 1, alignItems: 'center' },
  numericText: { fontSize: 23, color: colors.ink, fontWeight: '700', fontVariant: ['tabular-nums'] }, unit: { fontSize: 14, color: colors.muted, fontWeight: '500' },
  stepper: { minWidth: 50, minHeight: 50, padding: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.quiet },
  stepperText: { fontSize: 26, color: colors.ink, fontWeight: '600' },
  metric: { flexBasis: 145, flexGrow: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, gap: 5 },
  metricLabel: { fontSize: 14, color: colors.muted, fontWeight: '600' }, metricValue: { fontSize: 26, color: colors.ink, fontWeight: '700', fontVariant: ['tabular-nums'] }, metricNote: { fontSize: 12, lineHeight: 18, color: colors.muted },
});
