import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CrayonCard } from '../components/crayon/CrayonCard';
import { CrayonProgressBar } from '../components/crayon/CrayonProgressBar';
import { Lamb as CrayonLamb } from '../components/crayon/Lamb';
import { Tree as CrayonTree } from '../components/crayon/Tree';
import { LambGuide } from '../components/guide/LambGuide';
import { ProgressBar } from '../components/pixel/ProgressBar';
import { Tree as PixelTree } from '../components/pixel/Tree';
import { buttonBase, COLORS, FONTS } from '../components/theme';
import { CRAYON_COLORS, CRAYON_FONTS } from '../lib/theme-crayon';
import { getMyDashboard, type MyDashboard } from '../lib/dashboard';
import { getErrorMessage } from '../lib/error-message';
import { buildLambGuide, pluralize } from '../lib/today-helpers';
import { getNextStage, getStageProgressPercent, getTreeStage, getTreeStageLabel } from '../lib/tree';

export default function CompareStylesScreen() {
  const [dashboard, setDashboard] = useState<MyDashboard | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    getMyDashboard()
      .then(setDashboard)
      .catch((error) => setErrorMessage(getErrorMessage(error)));
  }, []);

  if (errorMessage) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{errorMessage}</Text>
      </View>
    );
  }

  if (!dashboard) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const stage = getTreeStage(dashboard.totalCheckins);
  const nextStage = getNextStage(dashboard.totalCheckins);
  const stageProgressPercent = getStageProgressPercent(dashboard.totalCheckins);
  const lambGuide = buildLambGuide(dashboard, stage, false);

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <Text style={styles.intro}>
        The Today hero card and My tree card, Pixel and Crayon side by side, using your real reading data.
      </Text>

      <Text style={styles.columnLabel}>Pixel (current)</Text>
      <View style={styles.pixelHeroCard}>
        <LambGuide id="compare-pixel" message={lambGuide.message} pose={lambGuide.pose} sparkles={lambGuide.sparkles} />
        <Text style={styles.pixelHeroTitle}>Today's reading</Text>
        <Text style={styles.pixelHeroBody}>
          {dashboard.groups.length === 0
            ? "You're not in any groups yet."
            : `${dashboard.groups.length} group${dashboard.groups.length === 1 ? '' : 's'} today`}
        </Text>
      </View>
      <View style={styles.pixelCard}>
        <View style={styles.treeRow}>
          <PixelTree stage={stage} pixelSize={4} />
          <View style={styles.treeInfo}>
            <Text style={styles.pixelTreeStage}>{getTreeStageLabel(stage)}</Text>
            <Text style={styles.pixelTreeCount}>{pluralize(dashboard.totalCheckins, 'chapter')} read</Text>
            {nextStage ? (
              <>
                <ProgressBar percent={stageProgressPercent} segments={8} />
                <Text style={styles.pixelTreeNext}>
                  {pluralize(nextStage.remaining, 'more')} to grow into a {nextStage.label.toLowerCase()}
                </Text>
              </>
            ) : (
              <Text style={styles.pixelTreeNext}>You've reached full growth!</Text>
            )}
          </View>
        </View>
      </View>

      <Text style={styles.columnLabel}>Crayon (beta)</Text>
      <CrayonCard>
        <View style={styles.crayonLambRow}>
          <CrayonLamb size={48} />
          <Text style={styles.crayonLambText}>
            {lambGuide.message}
            {lambGuide.sparkles ? ' ✨' : ''}
          </Text>
        </View>
        <Text style={styles.crayonHeroTitle}>Today's reading</Text>
        <Text style={styles.crayonHeroBody}>
          {dashboard.groups.length === 0
            ? "You're not in any groups yet."
            : `${dashboard.groups.length} group${dashboard.groups.length === 1 ? '' : 's'} today`}
        </Text>
      </CrayonCard>
      <CrayonCard>
        <View style={styles.treeRow}>
          <CrayonTree stage={stage} size={56} />
          <View style={styles.treeInfo}>
            <Text style={styles.crayonTreeStage}>{getTreeStageLabel(stage)}</Text>
            <Text style={styles.crayonTreeCount}>{pluralize(dashboard.totalCheckins, 'chapter')} read</Text>
            {nextStage ? (
              <>
                <CrayonProgressBar percent={stageProgressPercent} tone="sage" />
                <Text style={styles.crayonTreeNext}>
                  {pluralize(nextStage.remaining, 'more')} to grow into a {nextStage.label.toLowerCase()}
                </Text>
              </>
            ) : (
              <Text style={styles.crayonTreeNext}>You've reached full growth!</Text>
            )}
          </View>
        </View>
      </CrayonCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  error: {
    color: COLORS.error,
    textAlign: 'center',
  },
  intro: {
    fontFamily: FONTS.serif,
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  columnLabel: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 13,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  pixelHeroCard: {
    ...buttonBase,
    backgroundColor: COLORS.white,
    padding: 14,
    gap: 10,
  },
  pixelHeroTitle: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  pixelHeroBody: {
    fontFamily: FONTS.serif,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  pixelCard: {
    ...buttonBase,
    backgroundColor: COLORS.white,
    padding: 14,
  },
  treeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  treeInfo: {
    flex: 1,
    gap: 4,
  },
  pixelTreeStage: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  pixelTreeCount: {
    fontFamily: FONTS.serif,
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  pixelTreeNext: {
    marginTop: 4,
    fontFamily: FONTS.serif,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  crayonLambRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  crayonLambText: {
    flex: 1,
    fontFamily: CRAYON_FONTS.headingMedium,
    fontSize: 15,
    color: CRAYON_COLORS.textPrimary,
  },
  crayonHeroTitle: {
    marginTop: 10,
    fontFamily: CRAYON_FONTS.heading,
    fontSize: 18,
    color: CRAYON_COLORS.textPrimary,
  },
  crayonHeroBody: {
    fontFamily: CRAYON_FONTS.serif,
    fontSize: 13,
    color: CRAYON_COLORS.textMuted,
  },
  crayonTreeStage: {
    fontFamily: CRAYON_FONTS.headingSemiBold,
    fontSize: 17,
    color: CRAYON_COLORS.textPrimary,
  },
  crayonTreeCount: {
    fontFamily: CRAYON_FONTS.serif,
    fontSize: 13,
    color: CRAYON_COLORS.textMuted,
    marginBottom: 4,
  },
  crayonTreeNext: {
    marginTop: 4,
    fontFamily: CRAYON_FONTS.serif,
    fontSize: 12,
    color: CRAYON_COLORS.textMuted,
  },
});
