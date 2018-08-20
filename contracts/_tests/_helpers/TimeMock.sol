pragma solidity ^0.4.18;

contract TimeMock {

    uint256 public m_time;
    function setCurrentTime(uint256 _time) external {
        m_time = _time;
    }
    function getCurrentTime() internal view returns (uint256) {
        if (m_time == 0) {
            return now;
        }

        return m_time;
    }

}
