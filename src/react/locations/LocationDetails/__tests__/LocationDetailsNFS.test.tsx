/* eslint-disable */
import { themeMount as mount, updateInputText } from '../../../utils/testUtil';
import LocationDetailsNFS from '../LocationDetailsNFS';
import { shallow } from 'enzyme';

const props = {
  details: {},
  onChange: () => {},
};
describe('class <LocationDetailsNFS />', () => {
  it('should correctly translate location details to state values', () => {
    const component = shallow(
      //@ts-expect-error fix this when you are working on it
      <LocationDetailsNFS
        {...props}
        details={{
          endpoint: 'tcp+v3://ep/export/path?hard&async',
        }}
      />,
    );
    expect(component.state()).toEqual({
      protocol: 'tcp',
      version: 'v3',
      server: 'ep',
      path: '/export/path',
      options: 'hard&async',
    });
  });
  it('should correctly translate state values to location details', () => {
    const onChangeFn = jest.fn();
    const component = shallow(
      //@ts-expect-error fix this when you are working on it
      <LocationDetailsNFS {...props} onChange={onChangeFn} />,
    );
    return new Promise((done) => {
      component.setState(
        {
          protocol: 'udp',
          version: 'v4',
          server: 'ep',
          path: '/export/test/path',
          options: 'soft&sync',
        },
        () => {
          expect(onChangeFn).toHaveBeenCalledWith({
            endpoint: 'udp+v4://ep/export/test/path?soft&sync',
          });
          //@ts-expect-error fix this when you are working on it
          done();
        },
      );
    });
  });
  it('should call onChange on mount', () => {
    const onChangeFn = jest.fn();
    //@ts-expect-error fix this when you are working on it
    mount(<LocationDetailsNFS {...props} onChange={onChangeFn} />);
    expect(onChangeFn).toHaveBeenCalledWith({
      endpoint: 'tcp+v3://',
    });
  });
  it('should call onChange on state update', () => {
    const refLocation = {
      endpoint: 'tcp+v3://ep/export/path?hard&async',
    };
    const refState = {
      protocol: 'tcp',
      version: 'v3',
      server: 'ep',
      path: '/export/path',
      options: 'hard&async',
    };
    const onChangeFn = jest.fn();
    const component = mount(
      //@ts-expect-error fix this when you are working on it
      <LocationDetailsNFS {...props} onChange={onChangeFn} />,
    );
    component.find(LocationDetailsNFS).setState({ ...refState }, () => {
      expect(onChangeFn).toHaveBeenCalledWith(refLocation);
    });
  });
  it('should show NFS details for empty details', () => {
    //@ts-expect-error fix this when you are working on it
    const component = mount(<LocationDetailsNFS {...props} />);
    expect(component.find('SelectBox#nfs-protocol')).toHaveLength(1);
    expect(component.find('SelectBox#nfs-protocol').text()).toEqual('TCP');
    expect(component.find('SelectBox#nfs-protocol').props().value).toEqual(
      'tcp',
    );
    expect(
      component.find('SelectBox#nfs-protocol').props().disabled,
    ).toBeFalsy();
    expect(component.find('SelectBox#nfs-version')).toHaveLength(1);
    expect(component.find('SelectBox#nfs-version').text()).toEqual('V3');
    expect(component.find('SelectBox#nfs-version').props().value).toEqual('v3');
    expect(
      component.find('SelectBox#nfs-version').props().disabled,
    ).toBeFalsy();
    expect(component.find('input[name="server"]')).toHaveLength(1);
    expect(component.find('input[name="server"]').props().value).toEqual('');
    expect(
      component.find('input[name="protocol"]').props().disabled,
    ).toBeFalsy();
    expect(component.find('input[name="path"]')).toHaveLength(1);
    expect(component.find('input[name="path"]').props().value).toEqual('');
    expect(
      component.find('input[name="protocol"]').props().disabled,
    ).toBeFalsy();
    expect(component.find('input[name="options"]')).toHaveLength(1);
    expect(component.find('input[name="options"]').props().value).toEqual('');
    expect(
      component.find('input[name="protocol"]').props().disabled,
    ).toBeFalsy();
  });
  it('should show NFS details when editing an existing location', () => {
    const locationDetails = {
      endpoint: 'tcp+v3://ep/export/path?hard&async',
    };
    const component = mount(
      //@ts-expect-error fix this when you are working on it
      <LocationDetailsNFS
        {...props}
        editingExisting={true}
        details={locationDetails}
      />,
    );
    expect(component.find('SelectBox#nfs-protocol')).toHaveLength(1);
    expect(component.find('SelectBox#nfs-protocol').text()).toEqual('TCP');
    expect(component.find('SelectBox#nfs-protocol').props().value).toEqual(
      'tcp',
    );
    expect(
      component.find('SelectBox#nfs-protocol').props().disabled,
    ).not.toBeFalsy();
    expect(component.find('SelectBox#nfs-version')).toHaveLength(1);
    expect(component.find('SelectBox#nfs-version').text()).toEqual('V3');
    expect(component.find('SelectBox#nfs-version').props().value).toEqual('v3');
    expect(
      component.find('SelectBox#nfs-version').props().disabled,
    ).not.toBeFalsy();
    expect(component.find('input[name="server"]')).toHaveLength(1);
    expect(component.find('input[name="server"]').props().value).toEqual('ep');
    expect(component.find('input[name="server"]').props().disabled).toBe(true);
    expect(component.find('input[name="path"]')).toHaveLength(1);
    expect(component.find('input[name="path"]').props().value).toEqual(
      '/export/path',
    );
    expect(component.find('input[name="path"]').props().disabled).toBe(true);
    expect(component.find('input[name="options"]')).toHaveLength(1);
    expect(component.find('input[name="options"]').props().value).toEqual(
      'hard&async',
    );
    expect(component.find('input[name="options"]').props().disabled).toBe(true);
  });
  it('should call onChange on location details updates', () => {
    const refLocation = {
      endpoint: 'udp+v4://ep/export/path?hard&async',
    };
    let location = {};
    const component = mount(
      //@ts-expect-error fix this when you are working on it
      <LocationDetailsNFS {...props} onChange={(l) => (location = l)} />,
    );
    component.find('Select.nfs-protocol').props().onChange({
      //@ts-expect-error fix this when you are working on it
      value: 'udp',
    });
    component.find('Select.nfs-version').props().onChange({
      //@ts-expect-error fix this when you are working on it
      value: 'v4',
    });
    updateInputText(component, 'server', 'ep');
    updateInputText(component, 'path', '/export/path');
    updateInputText(component, 'options', 'hard&async');
    expect(location).toEqual(refLocation);
  });
});
