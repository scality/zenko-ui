import { TextBadge } from './TextBadge';
import * as L from './ListLayout2';
type Props = {
  icon: JSX.Element;
  headTitle: string;
  numInstance: number;
};
export default function Header({ icon, headTitle, numInstance }: Props) {
  return (
    <L.Head>
      <L.HeadSlice>
        <L.HeadIcon>{icon}</L.HeadIcon>
      </L.HeadSlice>
      <L.HeadBody>
        <L.HeadTitleContainer>
          <L.HeadTitle>
            {headTitle}
            <TextBadge text={numInstance.toString()} variant="infoPrimary" />
          </L.HeadTitle>
        </L.HeadTitleContainer>
      </L.HeadBody>
    </L.Head>
  );
}
