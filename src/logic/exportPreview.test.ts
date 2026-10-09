import { exportLayout } from './exportPreview';

describe('quote layout export', () => {
  test('exports Lean as a one-cell module with its position and feet', () => {
    const layout = exportLayout(
      [{ id: 'lean-1', typeId: 'lean', w: 1, h: 1, col: 2, row: 0 }],
      true,
      6,
      4,
      'BUILDER_ONLY',
    );

    expect(layout.modules).toEqual([
      {
        id: 'lean-1',
        type: 'LEAN',
        x: 2,
        y: 0,
        w: 1,
        h: 1,
        feet: true,
        variant: 'default',
      },
    ]);
  });
});
