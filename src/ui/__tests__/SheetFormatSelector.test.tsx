/**
 * @jest-environment jsdom
 *
 * Smoke test for SheetFormatSelector component.
 * Verifies the component renders correctly and responds to user interaction.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SheetFormatSelector } from '../DrawingSheet/SheetFormatSelector';

describe('SheetFormatSelector', () => {
  it('renders the current sheet size label on the button', () => {
    const onChange = jest.fn();
    render(<SheetFormatSelector currentSize="A4" onChange={onChange} />);

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('A4 (210×297)');
  });

  it('shows dropdown with all sizes when clicked', () => {
    const onChange = jest.fn();
    render(<SheetFormatSelector currentSize="A3" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button'));

    // Dropdown header visible
    expect(screen.getByText('Sheet Format')).toBeInTheDocument();

    // All sizes appear (the current size appears in both button + dropdown)
    expect(screen.getAllByText('A4 (210×297)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('A2 (420×594)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('A0 (841×1189)').length).toBeGreaterThanOrEqual(1);
  });

  it('highlights the selected size in the dropdown', () => {
    const onChange = jest.fn();
    render(<SheetFormatSelector currentSize="A1" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button'));

    // A1 appears in both trigger button and dropdown item
    const a1Buttons = screen.getAllByText('A1 (594×841)');
    expect(a1Buttons.length).toBeGreaterThanOrEqual(2);

    // The dropdown item should have the highlighted class
    const highlighted = a1Buttons.find(
      (el) => el.className.includes('text-blue-600')
    );
    expect(highlighted).toBeTruthy();
  });

  it('calls onChange when a new size is selected', () => {
    const onChange = jest.fn();
    render(<SheetFormatSelector currentSize="A4" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button'));

    // Find the dropdown A2 button (not the trigger button)
    const a2Buttons = screen.getAllByText('A2 (420×594)');
    const dropdownA2 = a2Buttons.find(
      (el) => el.tagName === 'BUTTON' && el.className.includes('w-full')
    );
    expect(dropdownA2).toBeTruthy();
    fireEvent.click(dropdownA2!);

    expect(onChange).toHaveBeenCalledWith('A2');
  });
});
