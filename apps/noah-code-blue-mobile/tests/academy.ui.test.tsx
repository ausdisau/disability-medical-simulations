import React from 'react';
import { AccessibilityInfo, Linking, Platform } from 'react-native';
import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { ResuscitationAcademy } from '../src/learning/ResuscitationAcademy';
import { modules, profileNames, type CurriculumProfileId } from '../../../shared/noah-resuscitation/curriculum';
import App from '../App';

afterEach(() => jest.restoreAllMocks());

test.each(modules.flatMap((module, moduleIndex) => (Object.keys(profileNames) as CurriculumProfileId[]).map(profileId => ({ module, moduleIndex, profileId }))))(
  '$module.id displays the shared content and $profileId adaptation', async ({ module, moduleIndex, profileId }) => {
    await render(<ResuscitationAcademy learning={{ moduleIndex, profileId, selectedAnswer: null }} send={jest.fn()} />);
    expect(screen.getByRole('header', { name: `Module ${moduleIndex + 1} of 6. ${module.title}` })).toBeOnTheScreen();
    for (const text of [module.principle, module.adaptations[profileId], module.demonstration, module.question]) {
      expect(screen.getByText(text)).toBeOnTheScreen();
    }
    for (const other of Object.keys(profileNames) as CurriculumProfileId[]) {
      if (other !== profileId) expect(screen.queryByText(module.adaptations[other])).not.toBeOnTheScreen();
    }
    expect(screen.getByRole('link', { name: `Source: ${module.reference}` })).toBeOnTheScreen();
    expect(screen.getByText(module.url)).toHaveProp('selectable', true);
    expect(screen.getByRole('button', { name: profileNames[profileId] })).toBeSelected();
  },
);

test('learners navigate every module without answering; previous, direct selection and wraparound clear feedback', async () => {
  const user = userEvent.setup();
  await render(<App />);
  expect(screen.getByRole('header', { name: 'Learn resuscitation' })).toBeOnTheScreen();
  expect(screen.getAllByRole('button', { name: 'Previous module' })[0]).toBeDisabled();
  expect(screen.queryByRole('button', { name: 'Run' })).not.toBeOnTheScreen();
  for (let index = 0; index < modules.length; index++) {
    expect(screen.getByRole('header', { name: `Module ${index + 1} of 6. ${modules[index].title}` })).toBeOnTheScreen();
    await user.press(screen.getAllByRole('button', { name: index === 5 ? 'Return to first module' : 'Next module' })[0]);
  }
  await user.press(screen.getByRole('button', { name: `A. ${modules[0].options[0]}` }));
  expect(screen.getByText(`Review this interpretation. ${modules[0].feedback}`)).toHaveProp('accessibilityLiveRegion', 'polite');
  await user.press(screen.getByRole('button', { name: `B. ${modules[0].options[1]}` }));
  expect(screen.getByRole('button', { name: `B. ${modules[0].options[1]}` })).toBeSelected();
  expect(screen.getByText(`Supported reasoning. ${modules[0].feedback}`)).toBeOnTheScreen();
  await user.press(screen.getByRole('button', { name: 'Choose a module' }));
  expect(screen.getByRole('button', { name: 'Choose a module' })).toBeExpanded();
  expect(screen.getByRole('button', { name: `1. ${modules[0].title}` })).toBeSelected();
  await user.press(screen.getByRole('button', { name: `5. ${modules[4].title}` }));
  expect(screen.getByRole('button', { name: 'Choose a module' })).toBeCollapsed();
  expect(screen.getByText('Choose an interpretation to reveal the explanation.')).toBeOnTheScreen();
  await user.press(screen.getAllByRole('button', { name: 'Previous module' })[0]);
  expect(screen.getByRole('header', { name: `Module 4 of 6. ${modules[3].title}` })).toBeOnTheScreen();
});

test('case choice updates the lesson and practice destinations; the same lesson is retained on return', async () => {
  const user = userEvent.setup();
  await render(<App />);
  await user.press(screen.getAllByRole('button', { name: 'Next module' })[0]);
  await user.press(screen.getByRole('button', { name: profileNames.dmd }));
  expect(screen.getByText(modules[1].adaptations.dmd)).toBeOnTheScreen();
  await user.press(screen.getByRole('button', { name: 'Open bedside simulation' }));
  expect(screen.getByRole('header', { name: 'Kai Morgan, 19' })).toBeOnTheScreen();
  expect(screen.getByText('PAUSED')).toBeOnTheScreen();
  await user.press(screen.getByRole('button', { name: 'Learn resuscitation' }));
  expect(screen.getByRole('header', { name: `Module 2 of 6. ${modules[1].title}` })).toBeOnTheScreen();
  await user.press(screen.getByRole('button', { name: profileNames.adult }));
  await user.press(screen.getByRole('button', { name: 'Practise bag & CPR' }));
  expect(screen.getByRole('header', { name: 'Alex Taylor, 35' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Support' })).toBeSelected();
  expect(screen.getByText('PAUSED')).toBeOnTheScreen();
  await user.press(screen.getByRole('button', { name: 'Learn resuscitation' }));
  await user.press(screen.getAllByRole('button', { name: 'Choose Code Blue room' })[0]);
  await user.press(screen.getByRole('button', { name: 'Enter icu-01' }));
  await user.press(screen.getByRole('button', { name: 'Learn resuscitation' }));
  expect(screen.getByText(modules[1].adaptations.cp)).toBeOnTheScreen();
});

test('learning controls expose names, state, hints, 48-point targets, font scaling and visible keyboard focus', async () => {
  await render(<ResuscitationAcademy learning={{ moduleIndex: 0, profileId: 'cp', selectedAnswer: null }} send={jest.fn()} />);
  const button = screen.getByRole('button', { name: `A. ${modules[0].options[0]}` });
  expect(button).toHaveAccessibleName(`A. ${modules[0].options[0]}`);
  expect(button).toHaveProp('focusable', true);
  expect(button).toHaveProp('accessibilityHint', expect.stringContaining('no score'));
  expect(button).toHaveStyle({ minHeight: 48, minWidth: 48 });
  expect(screen.getByText(`A. ${modules[0].options[0]}`)).toHaveProp('allowFontScaling', true);
  expect(screen.getByText(`A. ${modules[0].options[0]}`)).not.toHaveProp('numberOfLines');
  expect(screen.getByText(`A. ${modules[0].options[0]}`)).not.toHaveProp('maxFontSizeMultiplier');
  expect(button).not.toHaveProp('onLongPress');
  await fireEvent(button, 'focus');
  expect(button).toHaveStyle({ borderWidth: 3 });
  await fireEvent(button, 'blur');
  expect(button).toHaveStyle({ borderWidth: 1 });
});

test('public source opening uses the exact shared URL and failures remain recoverable', async () => {
  const open = jest.spyOn(Linking, 'openURL').mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
  const user = userEvent.setup();
  await render(<App />);
  await user.press(screen.getByRole('link', { name: `Source: ${modules[0].reference}` }));
  expect(open).toHaveBeenCalledWith(modules[0].url);
  expect(await screen.findByText(/The source could not be opened/)).toHaveProp('accessibilityLiveRegion', 'polite');
  await user.press(screen.getByRole('link', { name: `Source: ${modules[0].reference}` }));
  expect(screen.queryByText(/The source could not be opened/)).not.toBeOnTheScreen();
  expect(screen.getByRole('header', { name: 'Learn resuscitation' })).toBeOnTheScreen();
});

test('VoiceOver feedback is announced without making the answer a timed or scored task', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibilityWithOptions').mockImplementation(() => {});
  const user = userEvent.setup();
  await render(<App />);
  await user.press(screen.getByRole('button', { name: `B. ${modules[0].options[1]}` }));
  expect(announce).toHaveBeenCalledWith(`Supported reasoning. ${modules[0].feedback}`, { queue: true });
});
