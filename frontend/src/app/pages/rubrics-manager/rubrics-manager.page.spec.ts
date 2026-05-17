import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RubricsManagerPage } from './rubrics-manager.page';

describe('RubricsManagerPage', () => {
  let component: RubricsManagerPage;
  let fixture: ComponentFixture<RubricsManagerPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RubricsManagerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
