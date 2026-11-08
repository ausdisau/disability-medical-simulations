import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { educationalDisclaimer, modules, profileNames, type CurriculumProfileId } from '../../../../shared/noah-resuscitation/curriculum';
import { ActionButton, Card, colors, Paragraph, shared } from '../components/Controls';
import type { LearningAction, LearningState } from '../session/companion';

export function ResuscitationAcademy({ learning, send }: { learning: LearningState; send: (action: LearningAction) => void }) {
  const { moduleIndex, selectedAnswer, profileId } = learning;
  const item = modules[moduleIndex];
  const [menuOpen, setMenuOpen] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [navigationRequest, setNavigationRequest] = useState(0);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const introHeading = useRef<React.ComponentRef<typeof View>>(null);
  const heading = useRef<React.ComponentRef<typeof View>>(null);
  const lessonTop = useRef(0);
  const sourceRequest = useRef(0);
  const feedback = selectedAnswer === null ? 'Choose an interpretation to reveal the explanation.'
    : `${selectedAnswer === item.answer ? 'Supported reasoning.' : 'Review this interpretation.'} ${item.feedback}`;

  // Move both the viewport and accessibility/keyboard focus after explicit
  // lesson navigation. No animated scroll, timer, gesture or long press needed.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (navigationRequest > 0) scroll.current?.scrollTo({ y: lessonTop.current, animated: false });
      const target = navigationRequest > 0 ? heading.current : introHeading.current;
      if (!target) return;
      if (Platform.OS === 'web') target.focus();
      else AccessibilityInfo.sendAccessibilityEvent(target, 'focus');
    });
    return () => cancelAnimationFrame(frame);
  }, [navigationRequest]);

  useEffect(() => {
    // Android and web use the live region below. VoiceOver needs an explicit,
    // queued announcement; it must not steal focus from the answer buttons.
    if (selectedAnswer !== null && Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibilityWithOptions(feedback, { queue: true });
    }
  }, [feedback, selectedAnswer]);

  useEffect(() => {
    setLinkError('');
    return () => { sourceRequest.current += 1; };
  }, [moduleIndex]);

  const chooseModule = (index: number) => {
    setMenuOpen(false);
    send({ type: 'choose-module', index });
    // Also restore focus when the current lesson is selected from the menu.
    setNavigationRequest(request => request + 1);
  };
  const openSource = async () => {
    const request = ++sourceRequest.current;
    setLinkError('');
    try { await Linking.openURL(item.url); }
    catch {
      if (sourceRequest.current !== request) return;
      const message = 'The source could not be opened. You can retry or copy the source address below. Learning remains available offline.';
      setLinkError(message);
      if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibilityWithOptions(message, { queue: true });
    }
  };
  const navigation = <View style={shared.sectionGap}>
    <ActionButton label="Previous module" disabled={moduleIndex === 0} onPress={() => chooseModule(moduleIndex - 1)} hint="Open the previous lesson and clear its reasoning selection." />
    <ActionButton label={moduleIndex === modules.length - 1 ? 'Return to first module' : 'Next module'} onPress={() => chooseModule((moduleIndex + 1) % modules.length)} hint="Open the next lesson. There is no grade or completion requirement." />
  </View>;

  return <ScrollView ref={scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
    <View ref={introHeading} accessible accessibilityRole="header" accessibilityLabel="Learn resuscitation" tabIndex={-1}>
      <Text accessible={false} style={s.title}>Learn resuscitation</Text>
    </View>
    <Paragraph>Resuscitation theory and disability adaptation</Paragraph>
    <Paragraph>Understand standard adult resuscitation science before adapting your assessment, equipment and communication to an individual. Disability never automatically defines arrest, capacity or a ceiling of care.</Paragraph>
    <Card title="Learn at your pace" tone="warm">
      <Paragraph>Fictional adults only. Unscored learning: no grade, countdown, completion gate or competence assessment. These lessons do not change simulation physiology or device parameters.</Paragraph>
      <Paragraph>Topics include deterioration and resuscitation. Skip, revisit or leave any module. All simulation rooms are paused while you read. A reading pause is an access feature, not an instruction to delay real emergency care.</Paragraph>
      <Paragraph>{educationalDisclaimer}</Paragraph>
      <Paragraph>Unvalidated educational prototype. Follow current local protocols and qualified supervision for clinical care.</Paragraph>
      <ActionButton label="Choose Code Blue room" onPress={() => send({ type: 'choose-rooms' })} hint="Leave learning and browse the fictional rooms. All clocks stay paused." />
    </Card>
    <Card title="Selected fictional case">
      <Paragraph>{profileNames[profileId]}. The examples describe this authored case, not everyone with the same diagnosis.</Paragraph>
      {(Object.keys(profileNames) as CurriculumProfileId[]).map(id => <ActionButton key={id}
        label={profileNames[id]} selected={profileId === id} onPress={() => send({ type: 'choose-case', profileId: id })}
        hint="Change the lesson’s individual adaptation. This does not change a simulation room." />)}
    </Card>
    <ActionButton label="Choose a module" expanded={menuOpen} onPress={() => setMenuOpen(open => !open)} hint="Show or hide all six lessons. You may open them in any order." />
    {menuOpen ? <View style={shared.sectionGap}>
      {modules.map((module, index) => <ActionButton key={module.id} label={`${index + 1}. ${module.title}`}
        selected={index === moduleIndex} onPress={() => chooseModule(index)} />)}
    </View> : null}
    <View style={shared.sectionGap} onLayout={event => { lessonTop.current = event.nativeEvent.layout.y; }}>
      <View ref={heading} accessible accessibilityRole="header" accessibilityLabel={`Module ${moduleIndex + 1} of ${modules.length}. ${item.title}`} tabIndex={-1}>
        <Text accessible={false} style={s.progress}>MODULE {moduleIndex + 1} OF {modules.length} · NO GRADE</Text>
        <Text accessible={false} style={s.lessonTitle}>{item.title}</Text>
      </View>
      {navigation}
      <Card title="1 · Core science"><Paragraph>{item.principle}</Paragraph></Card>
      <Card title="2 · Individual adaptation"><Paragraph>{profileNames[profileId]}</Paragraph><Paragraph>{item.adaptations[profileId]}</Paragraph></Card>
      <Card title="3 · Observe on the manikin">
        <Paragraph>{item.demonstration}</Paragraph>
        <Paragraph subtle>These observation prompts also describe the web manikin. This companion provides text and model readings; it does not show the web anatomy animation.</Paragraph>
      </Card>
      <Card title="4 · Check the reasoning · no grade">
        <Paragraph>{item.question}</Paragraph>
        {item.options.map((option, index) => <ActionButton key={`${item.id}-${index}`} label={`${String.fromCharCode(65 + index)}. ${option}`}
          selected={selectedAnswer === index} onPress={() => send({ type: 'answer', index })} hint="Reveal a formative explanation. You can choose again; no score is recorded." />)}
        <Text accessibilityLiveRegion="polite" style={s.feedback}>{feedback}</Text>
      </Card>
      <Card title="Source reference">
        <ActionButton role="link" label={`Source: ${item.reference}`} onPress={() => { void openSource(); }} hint="Opens a public reference in your browser. Internet access may be required." />
        <Text selectable style={s.sourceAddress}>{item.url}</Text>
        <Text accessibilityLiveRegion="polite" style={s.feedback}>{linkError}</Text>
      </Card>
      {navigation}
      <Card title="Try the fictional simulation">
        <Paragraph>Open {profileNames[profileId]}’s existing room with time paused. Previous room work and AAC holds are retained. Choose Run or Step only when ready.</Paragraph>
        <ActionButton label="Open bedside simulation" tone="primary" onPress={() => send({ type: 'practise', tab: 'Bedside' })} />
        <ActionButton label="Practise bag & CPR" onPress={() => send({ type: 'practise', tab: 'Support' })} />
        <ActionButton label="Choose Code Blue room" onPress={() => send({ type: 'choose-rooms' })} />
      </Card>
      <Paragraph subtle>{educationalDisclaimer}</Paragraph>
    </View>
  </ScrollView>;
}

const s = StyleSheet.create({
  content: { padding: 16, paddingBottom: 36, gap: 16 },
  title: { color: colors.navy, fontSize: 30, fontWeight: '800' },
  lessonTitle: { color: colors.navy, fontSize: 24, fontWeight: '700' },
  progress: { color: colors.teal, fontSize: 14, fontWeight: '700', marginBottom: 8 },
  feedback: { color: colors.ink, fontSize: 16, lineHeight: 24 },
  sourceAddress: { color: colors.blue, fontSize: 14, lineHeight: 22, flexShrink: 1 },
});
