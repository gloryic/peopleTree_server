package com.ssm.location;

interface LocationMeasurer {

	public void startRequest(long distanceForUpdate, long timeForUpdate);

	public void stopRequest();
	public boolean isValidLocation();
	public void setUpdateNotifier(UpdateNotifier u);
	public boolean isLocReqPossible();
}
