/**
 * The shared building blocks of the app's look: big left-aligned titles, pill
 * buttons, outlined list cards, pill and underline tabs, tip cards, empty
 * states and a sticky footer. Every screen is built from these so light and
 * dark mode, spacing and type stay consistent.
 */
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GUTTER, makeStyles, radius, spacing, useTheme } from '../theme';

export type FeatherName = ComponentProps<typeof Feather>['name'];

// ── Buttons ──────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  size = 'lg',
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: FeatherName;
  loading?: boolean;
  disabled?: boolean;
  size?: 'lg' | 'md' | 'sm';
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const fg =
    variant === 'primary' ? colors.onPrimary
    : variant === 'accent' ? colors.onAccent
    : variant === 'danger' ? colors.error
    : colors.text;
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      style={({ pressed }) => [
        styles.btn,
        size === 'lg' ? styles.btnLg : size === 'md' ? styles.btnMd : styles.btnSm,
        variant === 'primary' && styles.btnPrimary,
        variant === 'accent' && styles.btnAccent,
        (variant === 'secondary' || variant === 'danger') && styles.btnSecondary,
        disabled && !loading && styles.btnDisabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Feather name={icon} size={size === 'sm' ? 15 : 18} color={disabled ? colors.textMuted : fg} /> : null}
          <Text
            style={[
              styles.btnLabel,
              size === 'sm' && styles.btnLabelSm,
              { color: disabled ? colors.textMuted : fg },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/** Round 44pt button: the ⋮ menu, back arrow, close, filter. */
export function IconButton({
  icon,
  onPress,
  label,
  outlined,
  dot,
}: {
  icon: FeatherName;
  onPress: () => void;
  label: string;
  outlined?: boolean;
  /** Small coloured dot for unread items. */
  dot?: 'accent' | 'alert';
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.iconBtn, outlined && styles.iconBtnOutlined, pressed && styles.pressed]}
    >
      <Feather name={icon} size={22} color={colors.text} />
      {dot ? <View style={[styles.dot, { backgroundColor: dot === 'alert' ? colors.nowLine : colors.link }]} /> : null}
    </Pressable>
  );
}

/** Outlined "+ Add" pill used at the top right of list screens. */
export function AddButton({ onPress, label = 'Add', filled }: { onPress: () => void; label?: string; filled?: boolean }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.addBtn, filled && styles.btnPrimary, pressed && styles.pressed]}
    >
      <Feather name="plus" size={18} color={filled ? colors.onPrimary : colors.text} />
      <Text style={[styles.addLabel, filled && { color: colors.onPrimary }]}>{label}</Text>
    </Pressable>
  );
}

// ── Page structure ───────────────────────────────────────────────────────────

/**
 * Top of a screen: back/close on the left, actions on the right, then a big
 * bold title with an optional count badge and a one-line description.
 */
export function PageHeader({
  title,
  count,
  description,
  onLearnMore,
  onBack,
  onClose,
  actions,
  eyebrow,
}: {
  title?: string;
  count?: number;
  description?: string;
  onLearnMore?: () => void;
  onBack?: () => void;
  onClose?: () => void;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}) {
  const styles = useStyles();
  const hasBar = onBack || onClose || actions;
  return (
    <View style={styles.pageHeader}>
      {hasBar ? (
        <View style={styles.headerBar}>
          {onBack ? <IconButton icon="arrow-left" label="Back" onPress={onBack} /> : <View />}
          <View style={styles.headerActions}>
            {actions}
            {onClose ? <IconButton icon="x" label="Close" onPress={onClose} /> : null}
          </View>
        </View>
      ) : null}
      {eyebrow}
      {title ? (
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle} accessibilityRole="header">{title}</Text>
          {count != null ? <CountBadge count={count} /> : null}
        </View>
      ) : null}
      {description ? (
        <Text style={styles.pageDescription}>
          {description}
          {onLearnMore ? (
            <Text style={styles.link} onPress={onLearnMore}> Learn more</Text>
          ) : null}
        </Text>
      ) : null}
    </View>
  );
}

/** A scrolling page with the standard gutter, safe-area top and room for a sticky footer. */
export function Page({
  children,
  footer,
  refreshControl,
  contentStyle,
}: {
  children: ReactNode;
  footer?: ReactNode;
  refreshControl?: ComponentProps<typeof ScrollView>['refreshControl'];
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={[styles.pageContent, { paddingTop: insets.top + spacing.sm }, contentStyle]}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer}
    </View>
  );
}

/** The bar pinned to the bottom of forms and intro pages: one or two pill buttons. */
export function StickyFooter({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  return <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>{children}</View>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const styles = useStyles();
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle} accessibilityRole="header">{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
          <Text style={styles.link}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ── Lists ────────────────────────────────────────────────────────────────────

/** One outlined rounded card holding rows, with an optional heading above it. */
export function ListGroup({ title, children }: { title?: string; children: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.group}>
      {title ? <SectionTitle title={title} /> : null}
      <View style={styles.groupCard}>{children}</View>
    </View>
  );
}

export function ListRow({
  icon,
  label,
  sublabel,
  onPress,
  trailing = 'chevron',
  danger,
  status,
}: {
  icon?: FeatherName;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  /** 'external' shows ↗ for shortcuts that jump to another part of the app. */
  trailing?: 'chevron' | 'external' | 'none' | ReactNode;
  danger?: boolean;
  status?: { label: string; tone: 'success' | 'warning' | 'muted' | 'accent' };
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const tone = status
    ? { success: colors.success, warning: colors.warning, muted: colors.textMuted, accent: colors.link }[status.tone]
    : undefined;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      {icon ? <Feather name={icon} size={22} color={danger ? colors.error : colors.text} /> : null}
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, danger && { color: colors.error }]}>{label}</Text>
        {sublabel ? <Text style={styles.rowSub}>{sublabel}</Text> : null}
        {status ? <Text style={[styles.rowStatus, { color: tone }]}>{status.label}</Text> : null}
      </View>
      {trailing === 'chevron' ? <Feather name="chevron-right" size={20} color={colors.text} />
        : trailing === 'external' ? <Feather name="arrow-up-right" size={20} color={colors.text} />
        : trailing === 'none' ? null
        : trailing}
    </Pressable>
  );
}

export function Divider({ inset = 0 }: { inset?: number }) {
  const styles = useStyles();
  return <View style={[styles.divider, { marginLeft: inset }]} />;
}

// ── Inputs ───────────────────────────────────────────────────────────────────

export function SearchField({
  value,
  onChangeText,
  placeholder,
  onFilter,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  onFilter?: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.searchRow}>
      <View style={styles.search}>
        <Feather name="search" size={20} color={colors.text} />
        <TextInput
          style={styles.searchInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel={placeholder}
        />
        {value ? (
          <Pressable onPress={() => onChangeText('')} hitSlop={8} accessibilityLabel="Clear search">
            <Feather name="x" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {onFilter ? <IconButton icon="sliders" label="Filter" onPress={onFilter} outlined /> : null}
    </View>
  );
}

/** Bold label above an outlined field, with "(Optional)", helper text and an error line. */
export function Field({
  label,
  optional,
  helper,
  error,
  counter,
  ...input
}: TextInputProps & { label: string; optional?: boolean; helper?: string; error?: string; counter?: number }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const length = typeof input.value === 'string' ? input.value.length : 0;
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>
          {label}
          {optional ? <Text style={styles.fieldOptional}> (Optional)</Text> : null}
        </Text>
        {counter ? <Text style={styles.fieldOptional}>{length}/{counter}</Text> : null}
      </View>
      <TextInput
        placeholderTextColor={colors.textMuted}
        {...input}
        maxLength={counter ?? input.maxLength}
        style={[styles.fieldInput, input.multiline && styles.fieldMultiline, error && { borderColor: colors.error }, input.style]}
        accessibilityLabel={label}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : helper ? <Text style={styles.fieldHelper}>{helper}</Text> : null}
    </View>
  );
}

export function ToggleRow({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description ? <Text style={styles.rowSub}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.accent, false: colors.borderStrong }}
        thumbColor={colors.white}
        ios_backgroundColor={colors.borderStrong}
        accessibilityLabel={label}
      />
    </View>
  );
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

export interface TabOption<K extends string> {
  key: K;
  label: string;
  count?: number;
}

/** Filter pills: the active one is a filled pill, the rest are plain text. Scrolls sideways. */
export function PillTabs<K extends string>({
  options,
  value,
  onChange,
}: {
  options: TabOption<K>[];
  value: K;
  onChange: (k: K) => void;
}) {
  const styles = useStyles();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[styles.pill, on && styles.pillOn]}
          >
            <Text style={[styles.pillLabel, on && styles.pillLabelOn]}>{o.label}</Text>
            {o.count != null ? <CountBadge count={o.count} inverted={on} /> : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** View switcher: text tabs with an underline under the active one. */
export function UnderlineTabs<K extends string>({
  options,
  value,
  onChange,
}: {
  options: TabOption<K>[];
  value: K;
  onChange: (k: K) => void;
}) {
  const styles = useStyles();
  return (
    <View style={styles.underlineWrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.underlineTabs}>
        {options.map((o) => {
          const on = o.key === value;
          return (
            <Pressable
              key={o.key}
              onPress={() => onChange(o.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              style={[styles.underlineTab, on && styles.underlineTabOn]}
            >
              <Text style={[styles.underlineLabel, on && styles.underlineLabelOn]}>{o.label}</Text>
              {o.count != null ? <CountBadge count={o.count} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ── Small pieces ─────────────────────────────────────────────────────────────

export function CountBadge({ count, inverted }: { count: number; inverted?: boolean }) {
  const styles = useStyles();
  return (
    <View style={[styles.badge, inverted && styles.badgeInverted]}>
      <Text style={[styles.badgeText, inverted && styles.badgeTextInverted]}>{count}</Text>
    </View>
  );
}

export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const styles = useStyles();
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('') || '?';
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}

/** Indigo note with an optional action and dismiss: tips, nudges, "turn on notifications". */
export function TipCard({
  icon = 'info',
  title,
  body,
  actionLabel,
  onAction,
  onDismiss,
}: {
  icon?: FeatherName;
  title?: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.tip}>
      <Feather name={icon} size={22} color={colors.link} />
      <View style={{ flex: 1, gap: 4 }}>
        {title ? <Text style={styles.tipTitle}>{title}</Text> : null}
        <Text style={styles.tipBody}>{body}</Text>
        {actionLabel && onAction ? (
          <View style={{ flexDirection: 'row', marginTop: spacing.md }}>
            <Button label={actionLabel} onPress={onAction} variant="secondary" size="sm" />
          </View>
        ) : null}
      </View>
      {onDismiss ? (
        <Pressable onPress={onDismiss} hitSlop={10} accessibilityLabel="Dismiss">
          <Feather name="x" size={20} color={colors.text} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  onAction,
  boxed = true,
}: {
  icon: FeatherName;
  title: string;
  body?: string;
  action?: string;
  onAction?: () => void;
  boxed?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={[styles.empty, boxed && styles.emptyBoxed]}>
      <Feather name={icon} size={44} color={colors.link} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
      {action && onAction ? <Button label={action} onPress={onAction} variant="secondary" size="md" style={{ marginTop: spacing.md }} /> : null}
    </View>
  );
}

/** Outlined card with a bold label and one big figure. */
export function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  const styles = useStyles();
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
    </View>
  );
}

/** Segmented progress across the top of multi-step flows. `progress` is 0–1 within `current`. */
export function SegmentProgress({ total, current, progress = 1 }: { total: number; current: number; progress?: number }) {
  const styles = useStyles();
  return (
    <View style={styles.segments} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: current + progress }}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={styles.segment}>
          <View
            style={[
              styles.segmentFill,
              { width: i < current ? '100%' : i === current ? `${Math.round(progress * 100)}%` : '0%' },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

/** Square app-style tile: solid navy with a white glyph, or a custom tone and glyph colour. */
export function AppTile({ icon, size = 56, tone, glyph }: { icon: FeatherName; size?: number; tone?: string; glyph?: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.24,
        backgroundColor: tone ?? colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Feather name={icon} size={size * 0.46} color={glyph ?? colors.white} />
    </View>
  );
}

export function CheckItem({ text, tone = 'plain' }: { text: string; tone?: 'plain' | 'good' | 'bad' }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const icon: FeatherName = tone === 'bad' ? 'x-circle' : tone === 'good' ? 'check-circle' : 'check';
  const color = tone === 'bad' ? colors.error : tone === 'good' ? colors.success : colors.text;
  return (
    <View style={styles.checkItem}>
      <Feather name={icon} size={22} color={color} />
      <Text style={styles.checkText}>{text}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  pressed: { opacity: 0.7 },

  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.pill },
  btnLg: { minHeight: 56, paddingHorizontal: spacing.xl },
  btnMd: { minHeight: 46, paddingHorizontal: spacing.lg + 4 },
  btnSm: { minHeight: 38, paddingHorizontal: spacing.lg },
  btnPrimary: { backgroundColor: colors.primary },
  btnAccent: { backgroundColor: colors.accent },
  btnSecondary: { borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: 'transparent' },
  btnDisabled: { backgroundColor: colors.surface, borderColor: colors.surface },
  btnLabel: { fontSize: 15, fontWeight: '600' },
  btnLabelSm: { fontSize: 14 },

  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  iconBtnOutlined: { borderWidth: 1, borderColor: colors.borderStrong },
  dot: { position: 'absolute', top: 7, right: 7, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: colors.background },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 44, paddingHorizontal: 18,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderStrong,
  },
  addLabel: { fontSize: 14, fontWeight: '600', color: colors.text },

  page: { flex: 1, backgroundColor: colors.background },
  pageContent: { paddingHorizontal: GUTTER, paddingBottom: 48, gap: 28 },
  pageHeader: { gap: 10 },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginLeft: -10, minHeight: 48 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pageTitle: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.6, color: colors.text, flexShrink: 1 },
  pageDescription: { fontSize: 14, lineHeight: 19, color: colors.textSecondary },
  link: { color: colors.link, fontWeight: '500' },

  footer: {
    paddingHorizontal: GUTTER, paddingTop: spacing.lg, gap: spacing.md, flexDirection: 'row',
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background,
  },

  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, color: colors.text },

  group: { gap: spacing.md },
  groupCard: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingVertical: 6, backgroundColor: colors.card },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingVertical: 15 },
  rowPressed: { backgroundColor: colors.surface },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 15, fontWeight: '500', color: colors.text },
  rowSub: { fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  rowStatus: { fontSize: 13, fontWeight: '500' },
  divider: { height: 1, backgroundColor: colors.border },

  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  search: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, height: 52, paddingHorizontal: 18,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderStrong,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text, paddingVertical: 0 },

  field: { gap: 8 },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  fieldOptional: { fontSize: 14, fontWeight: '400', color: colors.textMuted },
  fieldInput: {
    minHeight: 54, borderRadius: 12, borderWidth: 1, borderColor: colors.fieldBorder, backgroundColor: colors.field,
    paddingHorizontal: 18, fontSize: 15, color: colors.text,
  },
  fieldMultiline: { minHeight: 120, paddingTop: 16, textAlignVertical: 'top' },
  fieldHelper: { fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  fieldError: { fontSize: 13, color: colors.error },

  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 6 },

  pills: { gap: 8, paddingRight: GUTTER },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 20, borderRadius: radius.pill },
  pillOn: { backgroundColor: colors.primary },
  pillLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  pillLabelOn: { color: colors.onPrimary },

  underlineWrap: { borderBottomWidth: 1, borderBottomColor: colors.border, marginHorizontal: -GUTTER },
  underlineTabs: { paddingHorizontal: GUTTER, gap: 28 },
  underlineTab: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14, borderBottomWidth: 3, borderBottomColor: 'transparent', marginBottom: -1 },
  underlineTabOn: { borderBottomColor: colors.text },
  underlineLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  underlineLabelOn: { color: colors.text },

  badge: { minWidth: 26, height: 26, borderRadius: 13, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  badgeInverted: { backgroundColor: colors.border, borderColor: colors.border },
  badgeText: { fontSize: 13, fontWeight: '600', color: colors.text, fontVariant: ['tabular-nums'] },
  badgeTextInverted: { color: colors.text },

  avatar: { backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700', color: colors.link },

  tip: {
    flexDirection: 'row', gap: 14, padding: 20, borderRadius: 18,
    backgroundColor: colors.tip, borderWidth: 1, borderColor: colors.tipBorder,
  },
  tipTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  tipBody: { fontSize: 14, lineHeight: 20, color: colors.text },

  empty: { alignItems: 'center', gap: 8, paddingVertical: 40, paddingHorizontal: 24 },
  emptyBoxed: { borderWidth: 1, borderColor: colors.border, borderRadius: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text, textAlign: 'center', marginTop: 8 },
  emptyBody: { fontSize: 14, lineHeight: 20, color: colors.textSecondary, textAlign: 'center' },

  stat: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 22, gap: 6 },
  statLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  statValue: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5, color: colors.text, fontVariant: ['tabular-nums'] },

  segments: { flexDirection: 'row', gap: 8 },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
  segmentFill: { height: 4, backgroundColor: colors.accent },

  checkItem: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  checkText: { flex: 1, fontSize: 15, lineHeight: 20, color: colors.text },
}));
