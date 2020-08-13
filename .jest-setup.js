import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import "core-js/stable";
import "regenerator-runtime/runtime";

Enzyme.configure({ adapter: new Adapter() });

HTMLCanvasElement.prototype.getContext = () => {};
